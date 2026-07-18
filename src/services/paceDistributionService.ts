import { buildSmoothedPaceSegments, type PaceSegment } from './paceSegments';
import type {
  PaceConfidence,
  PaceDistributionResult,
  PaceProfile,
  PaceRangeKey,
  PaceRangeResult,
} from '../types/paceAnalysis';
import type { ActivityRecord } from '../types/activity';

const RANGE_LABELS: Record<PaceRangeKey, string> = {
  recovery: 'Recovery',
  easy: 'Easy',
  workout: 'Workout',
  hard: 'Hard',
};

export const RANGE_EXPLANATIONS: Record<PaceRangeKey, string> = {
  recovery:
    'Your slowest personalized range — recovery jogging, warmups, cooldowns, walking, and easing between harder segments.',
  easy: 'A sustainable pace relative to your recent running — the range most easy runs and long-run effort fall into.',
  workout:
    'Faster, purposeful running meaningfully above your easy pace — tempo, threshold, and sustained faster segments.',
  hard: 'Your fastest personalized range — short intervals, sprints, hill repeats, and finishing kicks you can only hold briefly.',
};

function bucketFor(paceSecPerMile: number, profile: PaceProfile): PaceRangeKey {
  if (paceSecPerMile < profile.workoutThresholdSec) return 'hard';
  if (paceSecPerMile < profile.easyThresholdSec) return 'workout';
  if (paceSecPerMile < profile.recoveryThresholdSec) return 'easy';
  return 'recovery';
}

function classify(
  bucketedSegments: { key: PaceRangeKey; segment: PaceSegment }[],
  pct: Record<PaceRangeKey, number>,
  totalMovingSeconds: number,
): string {
  const fastPct = pct.workout + pct.hard;
  const slowPct = pct.recovery + pct.easy;

  if (pct.recovery >= 60 && fastPct < 10) return 'Recovery Run';
  if (pct.easy >= 65 && fastPct < 15) return 'Easy Run';

  const isShortRun = totalMovingSeconds <= 40 * 60;
  if (isShortRun && fastPct >= 40 && slowPct < 25) return 'Hard Effort';

  // Count alternations between a "fast" state (workout/hard) and a "slow" state
  // (recovery/easy) to distinguish sustained workouts from interval-style pacing.
  let transitions = 0;
  let lastFast: boolean | null = null;
  for (const { key } of bucketedSegments) {
    const isFast = key === 'workout' || key === 'hard';
    if (lastFast !== null && isFast !== lastFast) transitions += 1;
    lastFast = isFast;
  }

  if (fastPct >= 20 && transitions >= 4) return 'Interval Run';
  if (fastPct >= 25) return 'Workout';

  // Progression: compare the average bucket "speed rank" of the first half vs second half.
  const rank: Record<PaceRangeKey, number> = { recovery: 0, easy: 1, workout: 2, hard: 3 };
  const half = Math.floor(bucketedSegments.length / 2);
  if (half >= 2) {
    const firstHalf = bucketedSegments.slice(0, half);
    const secondHalf = bucketedSegments.slice(half);
    const avgRank = (list: typeof bucketedSegments) =>
      list.reduce((sum, s) => sum + rank[s.key], 0) / list.length;
    if (avgRank(secondHalf) - avgRank(firstHalf) >= 0.6) return 'Progression Run';
  }

  const dominant = Math.max(pct.recovery, pct.easy, pct.workout, pct.hard);
  if (dominant >= 75) return 'Steady Run';

  return 'Mixed Intensity';
}

function buildInsight(
  classification: string,
  pct: Record<PaceRangeKey, number>,
  ranges: PaceRangeResult[],
): string {
  const dominant = ranges.reduce((a, b) => (b.percentOfMoving > a.percentOfMoving ? b : a));

  switch (classification) {
    case 'Recovery Run':
      return `This was primarily a recovery-paced run, with ${Math.round(pct.recovery)}% of your moving time in your Recovery range.`;
    case 'Easy Run':
      return `This was primarily an Easy run, with ${Math.round(pct.easy)}% of your moving time in your Easy pace range.`;
    case 'Progression Run':
      return 'You gradually increased your pace through the run, spending more time in faster ranges during the second half.';
    case 'Interval Run':
      return `This run alternated between faster efforts and slower recovery portions, spending ${Math.round(pct.workout + pct.hard)}% of moving time in Workout or Hard, which is consistent with interval-style pacing.`;
    case 'Hard Effort':
      return `A substantial portion of this shorter run — ${Math.round(pct.workout + pct.hard)}% of moving time — was in your Workout or Hard ranges.`;
    case 'Workout':
      return `You spent ${Math.round(pct.workout)}% of your moving time in your Workout range, a sustained faster effort.`;
    case 'Steady Run':
      return `Your pace stayed steady, with ${Math.round(dominant.percentOfMoving)}% of the run in a single pace range (${dominant.label}).`;
    default:
      return 'This run mixed several pace ranges without a single dominant pattern.';
  }
}

function buildHistoricalComparison(
  pct: Record<PaceRangeKey, number>,
  ranges: PaceRangeResult[],
  profile: PaceProfile,
): string | null {
  if (profile.runCount < 3) return null;

  const workoutRange = ranges.find((r) => r.key === 'workout');
  const hardRange = ranges.find((r) => r.key === 'hard');

  if (workoutRange && workoutRange.timeSeconds > 0 && workoutRange.timeSeconds >= profile.longestWorkoutSeconds) {
    return `This was your longest sustained Workout effort in your recent runs (${Math.round(workoutRange.timeSeconds / 60)} min).`;
  }

  if (hardRange && hardRange.timeSeconds > 0 && hardRange.timeSeconds >= profile.longestHardSeconds) {
    return `This was your longest sustained Hard effort in your recent runs (${Math.round(hardRange.timeSeconds / 60)} min).`;
  }

  const workoutDelta = pct.workout - profile.avgWorkoutPct;
  if (Math.abs(workoutDelta) >= 8) {
    const direction = workoutDelta > 0 ? 'more' : 'less';
    return `You spent ${Math.round(Math.abs(workoutDelta))}% ${direction} time in Workout than your recent runs typically average.`;
  }

  return null;
}

function confidenceNoteFor(confidence: PaceConfidence): string | null {
  if (confidence === 'limited') {
    return 'Pace ranges are still being personalized. Complete more runs to improve this analysis.';
  }
  return null;
}

/** Builds the full Pace Distribution card model for one completed activity. */
export function buildPaceDistribution(
  records: ActivityRecord[],
  profile: PaceProfile,
): PaceDistributionResult | null {
  const segments = buildSmoothedPaceSegments(records);
  if (segments.length === 0) return null;

  const gradeAdjustedFraction =
    segments.filter((s) => s.gradeAdjusted).length / segments.length;
  const useGradeAdjusted = gradeAdjustedFraction >= 0.6;

  const bucketedSegments = segments.map((segment) => ({
    key: bucketFor(useGradeAdjusted ? segment.adjustedPaceSecPerMile : segment.paceSecPerMile, profile),
    segment,
  }));

  const totals: Record<PaceRangeKey, { seconds: number; meters: number; paces: number[] }> = {
    recovery: { seconds: 0, meters: 0, paces: [] },
    easy: { seconds: 0, meters: 0, paces: [] },
    workout: { seconds: 0, meters: 0, paces: [] },
    hard: { seconds: 0, meters: 0, paces: [] },
  };

  for (const { key, segment } of bucketedSegments) {
    totals[key].seconds += segment.durationSeconds;
    totals[key].meters += segment.distanceMeters;
    totals[key].paces.push(segment.paceSecPerMile);
  }

  const totalMovingSeconds = (['recovery', 'easy', 'workout', 'hard'] as PaceRangeKey[]).reduce(
    (sum, key) => sum + totals[key].seconds,
    0,
  );
  if (totalMovingSeconds <= 0) return null;

  const bounds: Record<PaceRangeKey, [number | null, number | null]> = {
    recovery: [profile.recoveryThresholdSec, null],
    easy: [profile.easyThresholdSec, profile.recoveryThresholdSec],
    workout: [profile.workoutThresholdSec, profile.easyThresholdSec],
    hard: [null, profile.workoutThresholdSec],
  };

  const ranges: PaceRangeResult[] = (['recovery', 'easy', 'workout', 'hard'] as PaceRangeKey[]).map((key) => ({
    key,
    label: RANGE_LABELS[key],
    timeSeconds: totals[key].seconds,
    percentOfMoving: (totals[key].seconds / totalMovingSeconds) * 100,
    distanceMiles: totals[key].meters / 1609.344,
    paceLowSecPerMile: bounds[key][0],
    paceHighSecPerMile: bounds[key][1],
  }));

  const pct: Record<PaceRangeKey, number> = {
    recovery: ranges[0].percentOfMoving,
    easy: ranges[1].percentOfMoving,
    workout: ranges[2].percentOfMoving,
    hard: ranges[3].percentOfMoving,
  };

  const classification = classify(bucketedSegments, pct, totalMovingSeconds);
  const insight = buildInsight(classification, pct, ranges);
  const historicalComparison = buildHistoricalComparison(pct, ranges, profile);

  const trackDataConfidence: PaceConfidence =
    segments.length >= 15 ? 'high' : segments.length >= 5 ? 'moderate' : 'limited';
  const confidence: PaceConfidence =
    profile.confidence === 'limited' || trackDataConfidence === 'limited'
      ? 'limited'
      : profile.confidence === 'moderate' || trackDataConfidence === 'moderate'
        ? 'moderate'
        : 'high';

  return {
    ranges,
    totalMovingSeconds,
    classification,
    insight,
    historicalComparison,
    confidence,
    confidenceNote: confidenceNoteFor(confidence),
    gradeAdjusted: useGradeAdjusted,
  };
}
