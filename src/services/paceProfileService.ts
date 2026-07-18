import { fetchActivityTrack } from './activityTrackService';
import { buildSmoothedPaceSegments, type PaceSegment } from './paceSegments';
import { supabase } from './supabase';
import type { PaceConfidence, PaceProfile } from '../types/paceAnalysis';

const HISTORY_DAYS = 90;
const MAX_RUNS_POOLED = 20;
const REFRESH_AFTER_DAYS = 7;

/** Generic fallback used until a runner has any track history at all. */
const DEFAULT_PROFILE: Omit<PaceProfile, 'confidence' | 'computedAt' | 'runCount' | 'sampleCount'> = {
  recoveryThresholdSec: 11 * 60,
  easyThresholdSec: 9 * 60,
  workoutThresholdSec: 7.5 * 60,
  avgRecoveryPct: 0,
  avgEasyPct: 0,
  avgWorkoutPct: 0,
  avgHardPct: 0,
  longestWorkoutSeconds: 0,
  longestHardSeconds: 0,
};

function rowToProfile(row: {
  recovery_threshold_sec: number;
  easy_threshold_sec: number;
  workout_threshold_sec: number;
  run_count: number;
  sample_count: number;
  confidence: string;
  computed_at: string;
  avg_recovery_pct: number;
  avg_easy_pct: number;
  avg_workout_pct: number;
  avg_hard_pct: number;
  longest_workout_seconds: number;
  longest_hard_seconds: number;
}): PaceProfile {
  return {
    recoveryThresholdSec: row.recovery_threshold_sec,
    easyThresholdSec: row.easy_threshold_sec,
    workoutThresholdSec: row.workout_threshold_sec,
    runCount: row.run_count,
    sampleCount: row.sample_count,
    confidence: row.confidence as PaceConfidence,
    computedAt: row.computed_at,
    avgRecoveryPct: row.avg_recovery_pct,
    avgEasyPct: row.avg_easy_pct,
    avgWorkoutPct: row.avg_workout_pct,
    avgHardPct: row.avg_hard_pct,
    longestWorkoutSeconds: row.longest_workout_seconds,
    longestHardSeconds: row.longest_hard_seconds,
  };
}

/** Duration-weighted percentile: the pace at which `fraction` of pooled moving time is faster. */
function weightedPacePercentile(segments: PaceSegment[], fraction: number): number {
  const sorted = [...segments].sort((a, b) => a.paceSecPerMile - b.paceSecPerMile);
  const totalSeconds = sorted.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (totalSeconds <= 0) return DEFAULT_PROFILE.workoutThresholdSec;

  const target = totalSeconds * fraction;
  let cumulative = 0;
  for (const segment of sorted) {
    cumulative += segment.durationSeconds;
    if (cumulative >= target) return segment.paceSecPerMile;
  }
  return sorted[sorted.length - 1].paceSecPerMile;
}

function confidenceFor(runCount: number, sampleCount: number): PaceConfidence {
  if (runCount >= 8 && sampleCount >= 200) return 'high';
  if (runCount >= 3 && sampleCount >= 30) return 'moderate';
  return 'limited';
}

/**
 * Rebuilds a runner's personalized pace ranges from their last ~90 days of
 * tracked runs. Ranges are duration-weighted percentiles over smoothed pace
 * (not a simple average) so intervals/hills/walking don't skew the baseline,
 * and pooling many runs means one unusually fast/slow activity barely moves it.
 */
export async function refreshPaceProfile(userId: string): Promise<PaceProfile> {
  if (!supabase) {
    return { ...DEFAULT_PROFILE, runCount: 0, sampleCount: 0, confidence: 'limited', computedAt: new Date().toISOString() };
  }

  const since = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: activities, error } = await supabase
    .from('activities')
    .select('id, track_storage_path')
    .eq('user_id', userId)
    .not('track_storage_path', 'is', null)
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(MAX_RUNS_POOLED);

  if (error) throw error;

  const tracks = await Promise.all(
    (activities ?? []).map((activity) => fetchActivityTrack(activity.track_storage_path)),
  );

  const perRunSegments = tracks
    .map((records) => buildSmoothedPaceSegments(records))
    .filter((segments) => segments.length > 0);

  const allSegments = perRunSegments.flat();
  const runCount = perRunSegments.length;
  const sampleCount = allSegments.length;

  const workoutThresholdSec = sampleCount > 0 ? weightedPacePercentile(allSegments, 0.1) : DEFAULT_PROFILE.workoutThresholdSec;
  const easyThresholdSec = sampleCount > 0 ? weightedPacePercentile(allSegments, 0.4) : DEFAULT_PROFILE.easyThresholdSec;
  const recoveryThresholdSec = sampleCount > 0 ? weightedPacePercentile(allSegments, 0.78) : DEFAULT_PROFILE.recoveryThresholdSec;

  const { avgRecoveryPct, avgEasyPct, avgWorkoutPct, avgHardPct, longestWorkoutSeconds, longestHardSeconds } =
    poolRangeStats(perRunSegments, { recoveryThresholdSec, easyThresholdSec, workoutThresholdSec });

  const profile: PaceProfile = {
    recoveryThresholdSec,
    easyThresholdSec,
    workoutThresholdSec,
    runCount,
    sampleCount,
    confidence: confidenceFor(runCount, sampleCount),
    computedAt: new Date().toISOString(),
    avgRecoveryPct,
    avgEasyPct,
    avgWorkoutPct,
    avgHardPct,
    longestWorkoutSeconds,
    longestHardSeconds,
  };

  const { error: upsertError } = await supabase.from('user_pace_profiles').upsert({
    user_id: userId,
    recovery_threshold_sec: profile.recoveryThresholdSec,
    easy_threshold_sec: profile.easyThresholdSec,
    workout_threshold_sec: profile.workoutThresholdSec,
    run_count: profile.runCount,
    sample_count: profile.sampleCount,
    confidence: profile.confidence,
    computed_at: profile.computedAt,
    avg_recovery_pct: profile.avgRecoveryPct,
    avg_easy_pct: profile.avgEasyPct,
    avg_workout_pct: profile.avgWorkoutPct,
    avg_hard_pct: profile.avgHardPct,
    longest_workout_seconds: profile.longestWorkoutSeconds,
    longest_hard_seconds: profile.longestHardSeconds,
  });

  if (upsertError) throw upsertError;

  return profile;
}

function poolRangeStats(
  perRunSegments: PaceSegment[][],
  thresholds: { recoveryThresholdSec: number; easyThresholdSec: number; workoutThresholdSec: number },
) {
  let recoverySeconds = 0;
  let easySeconds = 0;
  let workoutSeconds = 0;
  let hardSeconds = 0;
  let longestWorkoutSeconds = 0;
  let longestHardSeconds = 0;

  for (const segments of perRunSegments) {
    let runWorkoutStreak = 0;
    let runHardStreak = 0;

    for (const segment of segments) {
      if (segment.paceSecPerMile < thresholds.workoutThresholdSec) {
        hardSeconds += segment.durationSeconds;
        runHardStreak += segment.durationSeconds;
        runWorkoutStreak = 0;
      } else if (segment.paceSecPerMile < thresholds.easyThresholdSec) {
        workoutSeconds += segment.durationSeconds;
        runWorkoutStreak += segment.durationSeconds;
        runHardStreak = 0;
      } else if (segment.paceSecPerMile < thresholds.recoveryThresholdSec) {
        easySeconds += segment.durationSeconds;
        runWorkoutStreak = 0;
        runHardStreak = 0;
      } else {
        recoverySeconds += segment.durationSeconds;
        runWorkoutStreak = 0;
        runHardStreak = 0;
      }

      longestWorkoutSeconds = Math.max(longestWorkoutSeconds, runWorkoutStreak);
      longestHardSeconds = Math.max(longestHardSeconds, runHardStreak);
    }
  }

  const total = recoverySeconds + easySeconds + workoutSeconds + hardSeconds;
  if (total <= 0) {
    return { avgRecoveryPct: 0, avgEasyPct: 0, avgWorkoutPct: 0, avgHardPct: 0, longestWorkoutSeconds: 0, longestHardSeconds: 0 };
  }

  return {
    avgRecoveryPct: (recoverySeconds / total) * 100,
    avgEasyPct: (easySeconds / total) * 100,
    avgWorkoutPct: (workoutSeconds / total) * 100,
    avgHardPct: (hardSeconds / total) * 100,
    longestWorkoutSeconds,
    longestHardSeconds,
  };
}

/** Reads the cached profile, recomputing when missing or stale (>7 days old). */
export async function getPaceProfile(userId: string): Promise<PaceProfile> {
  if (!supabase) {
    return { ...DEFAULT_PROFILE, runCount: 0, sampleCount: 0, confidence: 'limited', computedAt: new Date().toISOString() };
  }

  const { data, error } = await supabase
    .from('user_pace_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const ageMs = Date.now() - new Date(data.computed_at).getTime();
    if (ageMs < REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000) {
      return rowToProfile(data);
    }
  }

  return refreshPaceProfile(userId);
}
