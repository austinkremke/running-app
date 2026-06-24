import type { GpsPoint } from '../maps/types';
import type { ActivityRecord, ActivitySource } from '../types/activity';
import { haversineMeters } from './distanceService';

/** Map polyline / legacy UI — derived from records, not stored separately. */
export function recordsToGpsPoints(records: ActivityRecord[]): GpsPoint[] {
  return records.map((record) => ({
    latitude: record.latitude,
    longitude: record.longitude,
    timestamp: record.timestamp,
    accuracy: record.accuracyMeters,
    altitude: record.altitudeMeters,
    speed: record.speedMps,
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
