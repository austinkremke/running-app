import type { GpsPoint } from '../maps/types';
import type { ActivityRecord, ActivitySource } from '../types/activity';
import { haversineMeters } from './distanceService';
import { isUsableGpsPoint } from './runMetrics';

function elapsedSecondsFromStart(startedAt: string, timestamp: string): number {
  const startMs = new Date(startedAt).getTime();
  const sampleMs = new Date(timestamp).getTime();
  return Math.max(0, Math.floor((sampleMs - startMs) / 1000));
}

function gpsPointToRecordFields(
  point: GpsPoint,
  startedAt: string,
  distanceMeters: number,
  source: ActivitySource,
): ActivityRecord {
  return {
    timestamp: point.timestamp,
    latitude: point.latitude,
    longitude: point.longitude,
    distanceMeters,
    elapsedSeconds: elapsedSecondsFromStart(startedAt, point.timestamp),
    altitudeMeters: point.altitude ?? null,
    speedMps: point.speed ?? null,
    accuracyMeters: point.accuracy ?? null,
    source,
  };
}

export function createStartRecord(
  point: GpsPoint,
  startedAt: string,
  source: ActivitySource,
): ActivityRecord {
  return gpsPointToRecordFields(point, startedAt, 0, source);
}

export function appendGpsRecord(
  records: ActivityRecord[],
  point: GpsPoint,
  startedAt: string,
  source: ActivitySource,
): ActivityRecord[] | null {
  // Records built by this module always come from gpsPointToRecordFields with a real
  // GpsPoint, so coordinates are guaranteed here — only HealthKit imports (a separate
  // pipeline) ever produce route-less records with null latitude/longitude.
  const lastRecord = records[records.length - 1];
  const lastGps: GpsPoint | undefined = lastRecord
    ? {
        latitude: lastRecord.latitude!,
        longitude: lastRecord.longitude!,
        accuracy: lastRecord.accuracyMeters,
        altitude: lastRecord.altitudeMeters,
        speed: lastRecord.speedMps,
        timestamp: lastRecord.timestamp,
      }
    : undefined;

  if (!isUsableGpsPoint(point, lastGps)) {
    return null;
  }

  const segmentMeters = lastRecord ? haversineMeters(lastGps!, point) : 0;
  const distanceMeters = (lastRecord?.distanceMeters ?? 0) + segmentMeters;

  return [...records, gpsPointToRecordFields(point, startedAt, distanceMeters, source)];
}
