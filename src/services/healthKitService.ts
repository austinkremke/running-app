import {
  isHealthDataAvailable,
  queryQuantitySamples,
  queryWorkoutSamples,
  requestAuthorization,
  type WorkoutProxyTyped,
} from '@kingstinct/react-native-healthkit';

import {
  buildRecordsFromRoute,
  buildRecordsFromTimeGrid,
  type HkDistanceSample,
  type HkHeartRateSample,
} from './healthKitMappers';
import type { ActivityRecord } from '../types/activity';

/**
 * Read-only permission set — no write access requested. HKWorkoutRouteTypeIdentifier
 * is a separate authorization type from HKWorkoutTypeIdentifier itself; omitting it
 * causes getWorkoutRoutes() to throw "Authorization not determined" (HKError code 5).
 */
const READ_TYPES = [
  'HKWorkoutTypeIdentifier',
  'HKWorkoutRouteTypeIdentifier',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
] as const;

export type HealthKitWorkoutSummary = {
  uuid: string;
  activityType: string;
  startDate: Date;
  endDate: Date;
  durationSeconds: number;
  distanceMeters: number | null;
  sourceName: string;
  wasUserEntered: boolean;
};

const METERS_PER_UNIT: Record<string, number> = {
  m: 1,
  km: 1000,
  mi: 1609.344,
  yd: 0.9144,
  ft: 0.3048,
};

function toMeters(quantity: number, unit: string): number {
  return quantity * (METERS_PER_UNIT[unit] ?? 1);
}

export function isHealthKitAvailable(): boolean {
  return isHealthDataAvailable();
}

/** Requests read-only access. Must resolve before any query — HealthKit crashes on unauthorized reads. */
export async function requestHealthKitReadAccess(): Promise<boolean> {
  return requestAuthorization({ toRead: [...READ_TYPES] });
}

export function summarizeHealthKitWorkout(workout: WorkoutProxyTyped): HealthKitWorkoutSummary {
  return {
    uuid: workout.uuid,
    activityType: String(workout.workoutActivityType),
    startDate: workout.startDate,
    endDate: workout.endDate,
    durationSeconds: workout.duration.quantity,
    distanceMeters: workout.totalDistance ? toMeters(workout.totalDistance.quantity, workout.totalDistance.unit) : null,
    // .toJSON() rather than direct .name access — the library's documented safe
    // extraction path for pulling plain values out of Nitro-bridged proxy objects.
    sourceName: workout.sourceRevision.source.toJSON().name,
    wasUserEntered: Boolean(workout.metadata?.HKMetadataKeyWasUserEntered),
  };
}

export async function fetchRecentHealthKitWorkoutProxies(
  limit = 10,
  since?: Date,
): Promise<readonly WorkoutProxyTyped[]> {
  return queryWorkoutSamples({
    limit,
    ascending: false,
    filter: since ? { date: { startDate: since } } : undefined,
  });
}

/** Phase 1 smoke test — lists recent workouts with the fields the verification tier will need later. */
export async function fetchRecentHealthKitWorkouts(limit = 10): Promise<HealthKitWorkoutSummary[]> {
  const workouts = await fetchRecentHealthKitWorkoutProxies(limit);
  return workouts.map(summarizeHealthKitWorkout);
}

/**
 * Filters by the workout's own date range rather than `filter: { workout }` —
 * confirmed on-device that the workout-object filter silently returns zero
 * results even when real HR samples exist squarely inside the workout's time
 * window (verified via an unfiltered date-range query as a control test).
 */
async function fetchHeartRateSamplesForWorkout(workout: WorkoutProxyTyped): Promise<HkHeartRateSample[]> {
  const samples = await queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
    limit: 0,
    unit: 'count/min',
    filter: { date: { startDate: workout.startDate, endDate: workout.endDate } },
  });
  return samples.map((sample) => ({ startDate: sample.startDate, quantity: sample.quantity }));
}

/**
 * Real incremental distance samples for a workout (same date-range-filter
 * workaround as heart rate, since `filter: { workout }` doesn't return
 * results). Garmin writes these to HealthKit the same as Apple Watch does —
 * previously unused, we only read `workout.totalDistance` (a single
 * aggregate), which is why Garmin-synced runs showed a perfectly flat pace
 * line: distance was linearly apportioned across elapsed time instead of
 * using real per-interval distance.
 *
 * Three defensive steps beyond the raw query:
 *  1. Keep only samples from the workout's own source. An unfiltered date-range
 *     query can also return samples any OTHER app/device wrote to HealthKit for
 *     the same window (e.g. the phone's own Health app, a second fitness app) —
 *     summing those alongside the real ones double-counts distance.
 *  2. Keep only samples fully CONTAINED within [workoutStart, workoutEnd] —
 *     confirmed on-device: the date-range filter is edge-inclusive, so it can
 *     return a same-source "background" sample (e.g. general daily walking
 *     distance) whose window starts hours before the workout and merely ends
 *     at/after the workout's own start. That sample isn't part of the run at
 *     all, but its huge quantity value ends up anchored at time zero of the
 *     workout, corrupting the whole shape (observed: real run data gets
 *     squeezed into the back half of the chart, since the bogus sample's
 *     distance is counted as already "covered" before the run even starts).
 *  3. Drop any (already-contained, same-source) sample that overlaps the
 *     previous one in time — a single source can still occasionally emit
 *     overlapping correction/backfill samples.
 */
async function fetchDistanceSamplesForWorkout(workout: WorkoutProxyTyped): Promise<HkDistanceSample[]> {
  const raw = await queryQuantitySamples('HKQuantityTypeIdentifierDistanceWalkingRunning', {
    limit: 0,
    unit: 'm',
    filter: { date: { startDate: workout.startDate, endDate: workout.endDate } },
  });

  const workoutSourceName = workout.sourceRevision.source.toJSON().name;
  const workoutStartMs = workout.startDate.getTime();
  const workoutEndMs = workout.endDate.getTime();
  const contained = raw.filter(
    (sample) =>
      sample.sourceRevision.source.toJSON().name === workoutSourceName &&
      sample.startDate.getTime() >= workoutStartMs &&
      sample.endDate.getTime() <= workoutEndMs,
  );

  const sorted = [...contained].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const nonOverlapping: typeof sorted = [];
  let lastEndMs = -Infinity;
  for (const sample of sorted) {
    if (sample.startDate.getTime() < lastEndMs) continue;
    nonOverlapping.push(sample);
    lastEndMs = sample.endDate.getTime();
  }

  if (__DEV__) {
    console.log(
      `[healthKit] distance samples for ${workout.uuid}: ${raw.length} raw, ${contained.length} same-source+contained (${workoutSourceName}), ${nonOverlapping.length} after de-overlap`,
      nonOverlapping.slice(0, 3).map((s) => ({
        start: s.startDate.toISOString(),
        end: s.endDate.toISOString(),
        meters: s.quantity,
      })),
    );
  }

  return nonOverlapping.map((sample) => ({
    startDate: sample.startDate,
    endDate: sample.endDate,
    quantity: sample.quantity,
  }));
}

/**
 * Debug only — queries heart rate samples by date range with no workout
 * filter, to isolate whether `filter: { workout }` itself is broken versus
 * no HR data existing in HealthKit at all for the period.
 */
export async function fetchRecentHeartRateSamplesUnfiltered(hoursBack = 24): Promise<HkHeartRateSample[]> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const samples = await queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
    limit: 0,
    unit: 'count/min',
    filter: { date: { startDate: since } },
  });
  return samples.map((sample) => ({ startDate: sample.startDate, quantity: sample.quantity }));
}

/**
 * Phase 2 — builds ActivityRecord[] for one HealthKit workout, picking the
 * route-based path when a GPS route exists (Apple Watch) and falling back to
 * a route-less time grid otherwise (Garmin-via-HealthKit never carries a
 * route). Read-only; does not persist or sync anything.
 */
export async function buildActivityRecordsForWorkout(workout: WorkoutProxyTyped): Promise<ActivityRecord[]> {
  const [routes, heartRateSamples, distanceSamples] = await Promise.all([
    workout.getWorkoutRoutes(),
    fetchHeartRateSamplesForWorkout(workout),
    fetchDistanceSamplesForWorkout(workout),
  ]);

  const locations = routes.flatMap((route) =>
    route.locations.map((location) => ({
      date: location.date,
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
    })),
  );

  if (locations.length > 0) {
    return buildRecordsFromRoute(locations, heartRateSamples, workout.startDate);
  }

  const totalDistanceMeters = workout.totalDistance
    ? toMeters(workout.totalDistance.quantity, workout.totalDistance.unit)
    : 0;

  return buildRecordsFromTimeGrid(
    workout.startDate,
    workout.endDate,
    totalDistanceMeters,
    heartRateSamples,
    distanceSamples,
  );
}
