import type { ActivityRecord } from '../types/activity';

const METERS_PER_MILE = 1609.344;

/** Below this speed a point is treated as stopped/paused, not slow running. */
const STOPPED_SPEED_MPS = 0.3;
/** Above this speed a point-to-point jump is almost certainly a GPS error. */
const MAX_PLAUSIBLE_SPEED_MPS = 9.5;
/** Fastest pace we'll ever attribute to a smoothed window (2:30/mi) — guards divide-by-near-zero jitter. */
const FLOOR_PACE_SEC_PER_MILE = 150;
/** Each smoothed sample pools this many seconds of moving time so GPS jitter can't flip ranges rapidly. */
const WINDOW_SECONDS = 20;
/** A trailing partial window shorter than this is dropped rather than treated as its own sample. */
const MIN_TAIL_SECONDS = 8;
/** Roughly 1% grade adds/removes this fraction of effective pace demand. */
const GRADE_ADJUST_FACTOR_PER_PERCENT = 0.033;
const MAX_GRADE_PERCENT = 20;

export type PaceSegment = {
  durationSeconds: number;
  distanceMeters: number;
  /** Raw smoothed pace over the window. */
  paceSecPerMile: number;
  /** Grade-adjusted pace when altitude was reliable for this window, else equal to paceSecPerMile. */
  adjustedPaceSecPerMile: number;
  gradeAdjusted: boolean;
  elapsedSecondsEnd: number;
  /** Net elevation change over the window, meters (signed; null when altitude wasn't sampled). */
  elevChangeMeters: number | null;
  /** Average grade over the window, percent (signed; null when altitude wasn't sampled or grade was implausible). */
  gradePercent: number | null;
};

/**
 * Chunks a raw GPS track into ~20s moving-time windows, dropping stopped/paused
 * points and GPS-impossible jumps. Windowing is what keeps brief pace spikes
 * from flipping a sample between ranges (per-point instantaneous pace is too noisy).
 */
export function buildSmoothedPaceSegments(records: ActivityRecord[]): PaceSegment[] {
  if (records.length < 2) return [];

  const segments: PaceSegment[] = [];
  let cumTime = 0;
  let cumDist = 0;
  let cumElevMeters = 0;
  let cumElevSamples = 0;

  function flush(minSeconds: number, elapsedSecondsEnd: number) {
    if (cumTime >= minSeconds && cumDist > 0) {
      const rawPace = Math.max(FLOOR_PACE_SEC_PER_MILE, (cumTime / cumDist) * METERS_PER_MILE);
      const gradePercent = cumElevSamples > 0 ? (cumElevMeters / cumDist) * 100 : null;
      const gradeReliable = gradePercent != null && Math.abs(gradePercent) <= MAX_GRADE_PERCENT;

      const adjustedPace = gradeReliable
        ? rawPace / (1 + clamp(gradePercent! * GRADE_ADJUST_FACTOR_PER_PERCENT, -0.3, 0.5))
        : rawPace;

      segments.push({
        durationSeconds: cumTime,
        distanceMeters: cumDist,
        paceSecPerMile: rawPace,
        adjustedPaceSecPerMile: Math.max(FLOOR_PACE_SEC_PER_MILE, adjustedPace),
        gradeAdjusted: gradeReliable,
        elapsedSecondsEnd,
        elevChangeMeters: cumElevSamples > 0 ? cumElevMeters : null,
        gradePercent: gradeReliable ? gradePercent : null,
      });
    }

    cumTime = 0;
    cumDist = 0;
    cumElevMeters = 0;
    cumElevSamples = 0;
  }

  for (let i = 1; i < records.length; i += 1) {
    const prev = records[i - 1];
    const cur = records[i];
    const dt = cur.elapsedSeconds - prev.elapsedSeconds;
    const dd = cur.distanceMeters - prev.distanceMeters;
    if (dt <= 0 || dd < 0) continue;

    const speed = dd / dt;
    if (speed < STOPPED_SPEED_MPS || speed > MAX_PLAUSIBLE_SPEED_MPS) continue;

    cumTime += dt;
    cumDist += dd;

    if (prev.altitudeMeters != null && cur.altitudeMeters != null) {
      cumElevMeters += cur.altitudeMeters - prev.altitudeMeters;
      cumElevSamples += 1;
    }

    if (cumTime >= WINDOW_SECONDS) {
      flush(WINDOW_SECONDS, cur.elapsedSeconds);
    }
  }

  flush(MIN_TAIL_SECONDS, records[records.length - 1]?.elapsedSeconds ?? 0);

  return segments;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
