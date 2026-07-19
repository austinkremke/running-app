import { haversineMeters } from './distanceService';
import type { ActivityRecord } from '../types/activity';

export type HkHeartRateSample = {
  startDate: Date;
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

/** Finds the closest-in-time HR sample to a given instant, or null if none exist within range. */
function nearestHeartRate(samples: HkHeartRateSample[], at: Date, pointer: { index: number }): number | null {
  if (samples.length === 0) return null;

  while (
    pointer.index < samples.length - 1 &&
    Math.abs(samples[pointer.index + 1].startDate.getTime() - at.getTime()) <=
      Math.abs(samples[pointer.index].startDate.getTime() - at.getTime())
  ) {
    pointer.index += 1;
  }

  return Math.round(samples[pointer.index].quantity);
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
      heartRateBpm: nearestHeartRate(hrSorted, location.date, hrPointer),
      accuracyMeters: null,
      source: 'healthkit',
    };
  });
}

/**
 * Builds ActivityRecord[] for a route-less workout (Garmin-via-HealthKit
 * case — Garmin does not sync HKWorkoutRoute to Apple Health). Records are
 * placed on a fixed time grid with no coordinates; distance is apportioned
 * linearly across elapsed time from the workout's total distance, since no
 * per-point distance source exists.
 */
export function buildRecordsFromTimeGrid(
  workoutStart: Date,
  workoutEnd: Date,
  totalDistanceMeters: number,
  heartRateSamples: HkHeartRateSample[],
): ActivityRecord[] {
  const totalSeconds = Math.round((workoutEnd.getTime() - workoutStart.getTime()) / 1000);
  if (totalSeconds <= 0) return [];

  const hrSorted = [...heartRateSamples].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const hrPointer = { index: 0 };

  const records: ActivityRecord[] = [];
  for (let elapsedSeconds = 0; elapsedSeconds <= totalSeconds; elapsedSeconds += TIME_GRID_SECONDS) {
    const timestamp = new Date(workoutStart.getTime() + elapsedSeconds * 1000);
    const fraction = elapsedSeconds / totalSeconds;

    records.push({
      timestamp: timestamp.toISOString(),
      latitude: null,
      longitude: null,
      distanceMeters: totalDistanceMeters * fraction,
      elapsedSeconds,
      altitudeMeters: null,
      speedMps: null,
      heartRateBpm: nearestHeartRate(hrSorted, timestamp, hrPointer),
      accuracyMeters: null,
      source: 'healthkit',
    });
  }

  return records;
}
