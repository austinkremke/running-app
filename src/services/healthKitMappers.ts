import { haversineMeters } from './distanceService';
import type { ActivityRecord } from '../types/activity';

export type HkHeartRateSample = {
  startDate: Date;
  quantity: number;
};

export type HkDistanceSample = {
  startDate: Date;
  endDate: Date;
  quantity: number;
};

export type HkRouteLocation = {
  date: Date;
  latitude: number;
  longitude: number;
  altitude: number;
};

/** Grid spacing when no GPS route exists (Garmin-via-HealthKit case). */
const TIME_GRID_SECONDS = 15;

/** Heart rate at a given instant, linearly interpolated between the two
 *  real samples surrounding it (rather than snapping to whichever is
 *  nearest) — smooths out the stair-step look that shows up when the
 *  underlying HealthKit sample cadence (e.g. Garmin's) is coarser than our
 *  grid spacing. `pointer` lets callers walk both chronologically-sorted
 *  arrays together in one pass instead of re-scanning from the start each call. */
function heartRateAt(samples: HkHeartRateSample[], at: Date, pointer: { index: number }): number | null {
  if (samples.length === 0) return null;

  while (
    pointer.index < samples.length - 1 &&
    samples[pointer.index + 1].startDate.getTime() <= at.getTime()
  ) {
    pointer.index += 1;
  }

  const current = samples[pointer.index];
  const next = samples[pointer.index + 1];

  if (!next || at.getTime() <= current.startDate.getTime()) {
    return Math.round(current.quantity);
  }

  const spanMs = next.startDate.getTime() - current.startDate.getTime();
  if (spanMs <= 0) {
    return Math.round(current.quantity);
  }

  const t = Math.min(1, Math.max(0, (at.getTime() - current.startDate.getTime()) / spanMs));
  return Math.round(current.quantity + (next.quantity - current.quantity) * t);
}

/**
 * Builds ActivityRecord[] from a workout's GPS route (Apple Watch case).
 * Distance is recomputed from consecutive route points rather than trusted
 * from the workout total, since the route is the more granular source.
 */
export function buildRecordsFromRoute(
  locations: HkRouteLocation[],
  heartRateSamples: HkHeartRateSample[],
  workoutStart: Date,
): ActivityRecord[] {
  if (locations.length === 0) return [];

  const sorted = [...locations].sort((a, b) => a.date.getTime() - b.date.getTime());
  const hrSorted = [...heartRateSamples].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const hrPointer = { index: 0 };

  let cumulativeMeters = 0;
  const startMs = workoutStart.getTime();

  return sorted.map((location, index) => {
    if (index > 0) {
      cumulativeMeters += haversineMeters(sorted[index - 1], location);
    }

    return {
      timestamp: location.date.toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      distanceMeters: cumulativeMeters,
      elapsedSeconds: Math.max(0, Math.round((location.date.getTime() - startMs) / 1000)),
      altitudeMeters: location.altitude,
      speedMps: null,
      heartRateBpm: heartRateAt(hrSorted, location.date, hrPointer),
      accuracyMeters: null,
      source: 'healthkit',
    };
  });
}

type DistanceCheckpoint = { atMs: number; cumulative: number };

/** One checkpoint per real distance sample — (the sample's end time, running
 *  cumulative distance through it) — plus a starting checkpoint at 0. Used
 *  to linearly interpolate cumulative distance for ANY query time, including
 *  in the gaps *between* samples, not just within a single sample's own
 *  span. Holding distance flat during gaps (an earlier version of this)
 *  produces a flat-then-sudden-jump artifact every time real HealthKit
 *  samples arrive in bursts rather than continuously (observed in practice
 *  with Garmin-sourced data) — connecting sample checkpoints with straight
 *  lines instead gives a smooth, monotonic curve regardless of gaps. */
function buildDistanceCheckpoints(samples: HkDistanceSample[], workoutStartMs: number): DistanceCheckpoint[] {
  const checkpoints: DistanceCheckpoint[] = [
    { atMs: samples.length > 0 ? samples[0].startDate.getTime() : workoutStartMs, cumulative: 0 },
  ];

  let running = 0;
  for (const sample of samples) {
    running += sample.quantity;
    checkpoints.push({ atMs: sample.endDate.getTime(), cumulative: running });
  }

  return checkpoints;
}

function cumulativeDistanceAt(
  checkpoints: DistanceCheckpoint[],
  atMs: number,
  pointer: { index: number },
): number {
  if (checkpoints.length === 0) return 0;

  while (pointer.index < checkpoints.length - 1 && checkpoints[pointer.index + 1].atMs <= atMs) {
    pointer.index += 1;
  }

  const current = checkpoints[pointer.index];
  const next = checkpoints[pointer.index + 1];

  if (!next || atMs <= current.atMs) {
    return current.cumulative;
  }

  const spanMs = next.atMs - current.atMs;
  if (spanMs <= 0) {
    return current.cumulative;
  }

  const ratio = Math.min(1, Math.max(0, (atMs - current.atMs) / spanMs));
  return current.cumulative + ratio * (next.cumulative - current.cumulative);
}

/**
 * Builds ActivityRecord[] for a route-less workout (Garmin-via-HealthKit
 * case — Garmin does not sync HKWorkoutRoute to Apple Health). Records are
 * placed on a fixed time grid with no coordinates. When real incremental
 * distance samples are available (the normal case — Garmin writes these the
 * same as Apple Watch does), they're used for their *shape* — how distance
 * is distributed across the run, which is what makes pace vary realistically
 * instead of coming out perfectly flat — but never trusted as the absolute
 * total. Duplicate/overlapping samples from HealthKit (a real, observed
 * failure mode — e.g. more than one contributing stream even from a single
 * "source" name) can silently double-count distance, which would corrupt
 * not just the chart but the run's actual headline distance/pace/badges/XP,
 * since those all derive from this same total (`totalDistanceMeters` in
 * `activityMetrics.ts` reads the last record's `distanceMeters`). So the
 * real samples are rescaled so their sum always lands exactly on the
 * workout's own reported total distance — the one number Apple Health/the
 * watch itself vouches for — rather than trusting whatever the raw samples
 * happen to sum to. Falls back to apportioning the total evenly across
 * elapsed time only if HealthKit has no distance samples at all.
 */
export function buildRecordsFromTimeGrid(
  workoutStart: Date,
  workoutEnd: Date,
  totalDistanceMeters: number,
  heartRateSamples: HkHeartRateSample[],
  distanceSamples: HkDistanceSample[] = [],
): ActivityRecord[] {
  const totalSeconds = Math.round((workoutEnd.getTime() - workoutStart.getTime()) / 1000);
  if (totalSeconds <= 0) return [];

  const hrSorted = [...heartRateSamples].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const hrPointer = { index: 0 };

  const distanceSorted = [...distanceSamples].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const rawSampleTotal = distanceSorted.reduce((sum, sample) => sum + sample.quantity, 0);
  // Only trust the samples' shape if their raw sum is at least roughly
  // plausible (within 3x of the trusted total) — a wilder mismatch than
  // that means something is fundamentally wrong with the sample set (e.g.
  // duplicate sources slipping past the source filter) and blindly
  // rescaling it would still produce a realistic-looking but fabricated
  // shape. Safer to fall back to the flat apportionment in that case.
  const sampleTotalIsPlausible =
    rawSampleTotal > 0 && totalDistanceMeters > 0 && rawSampleTotal / totalDistanceMeters <= 3;
  const scale = sampleTotalIsPlausible ? totalDistanceMeters / rawSampleTotal : 1;
  const hasDistanceSamples = sampleTotalIsPlausible;
  const distanceCheckpoints = buildDistanceCheckpoints(distanceSorted, workoutStart.getTime());
  const distancePointer = { index: 0 };

  const records: ActivityRecord[] = [];
  for (let elapsedSeconds = 0; elapsedSeconds <= totalSeconds; elapsedSeconds += TIME_GRID_SECONDS) {
    const timestamp = new Date(workoutStart.getTime() + elapsedSeconds * 1000);
    const distanceMeters = hasDistanceSamples
      ? cumulativeDistanceAt(distanceCheckpoints, timestamp.getTime(), distancePointer) * scale
      : totalDistanceMeters * (elapsedSeconds / totalSeconds);

    records.push({
      timestamp: timestamp.toISOString(),
      latitude: null,
      longitude: null,
      distanceMeters,
      elapsedSeconds,
      altitudeMeters: null,
      speedMps: null,
      heartRateBpm: heartRateAt(hrSorted, timestamp, hrPointer),
      accuracyMeters: null,
      source: 'healthkit',
    });
  }

  return records;
}
