import type { GpsPoint } from '../maps/types';
import type { ActivityPolylinePoint } from './activityPolyline';
import type { ActivityRecord, ActivitySource } from '../types/activity';
import { haversineMeters } from './distanceService';

/**
 * Map polyline / legacy UI — derived from records, not stored separately.
 * Route-less records (e.g. Garmin imports via HealthKit) are dropped rather
 * than producing null-coordinate points.
 */
export function recordsToGpsPoints(records: ActivityRecord[]): GpsPoint[] {
  return records
    .filter((record) => record.latitude != null && record.longitude != null)
    .map((record) => ({
      latitude: record.latitude as number,
      longitude: record.longitude as number,
      timestamp: record.timestamp,
      accuracy: record.accuracyMeters,
      altitude: record.altitudeMeters,
      speed: record.speedMps,
    }));
}

export function polylineToGpsPoints(polyline: unknown, startedAt: string): GpsPoint[] {
  if (!Array.isArray(polyline) || polyline.length === 0) return [];

  const startMs = new Date(startedAt).getTime();

  return polyline
    .filter(
      (point): point is ActivityPolylinePoint =>
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === 'number' &&
        typeof point[1] === 'number',
    )
    .map((point, index) => ({
      longitude: point[0],
      latitude: point[1],
      timestamp: new Date(startMs + index * 1000).toISOString(),
    }));
}

/** Migrate legacy runs that only stored GpsPoint[]. */
export function recordsFromGpsPoints(
  points: GpsPoint[],
  startedAt: string,
  source: ActivitySource,
): ActivityRecord[] {
  if (points.length === 0) return [];

  const startMs = new Date(startedAt).getTime();
  const records: ActivityRecord[] = [];
  let cumulativeMeters = 0;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (index > 0) {
      cumulativeMeters += haversineMeters(points[index - 1], point);
    }

    const sampleMs = new Date(point.timestamp).getTime();
    records.push({
      timestamp: point.timestamp,
      latitude: point.latitude,
      longitude: point.longitude,
      distanceMeters: cumulativeMeters,
      elapsedSeconds: Math.max(0, Math.floor((sampleMs - startMs) / 1000)),
      altitudeMeters: point.altitude ?? null,
      speedMps: point.speed ?? null,
      accuracyMeters: point.accuracy ?? null,
      source,
    });
  }

  return records;
}
