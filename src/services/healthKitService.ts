import {
  isHealthDataAvailable,
  queryQuantitySamples,
  queryWorkoutSamples,
  requestAuthorization,
  type WorkoutProxyTyped,
} from '@kingstinct/react-native-healthkit';

import { buildRecordsFromRoute, buildRecordsFromTimeGrid, type HkHeartRateSample } from './healthKitMappers';
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
  const [routes, heartRateSamples] = await Promise.all([
    workout.getWorkoutRoutes(),
    fetchHeartRateSamplesForWorkout(workout),
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

  return buildRecordsFromTimeGrid(workout.startDate, workout.endDate, totalDistanceMeters, heartRateSamples);
}
