import type { ActivityRecord } from '../types/activity';

export type ActivityPolylinePoint = [longitude: number, latitude: number];

const DEFAULT_MAX_POINTS = 500;

type GeoRecord = ActivityRecord & { latitude: number; longitude: number };

function hasCoordinates(record: ActivityRecord): record is GeoRecord {
  return record.latitude != null && record.longitude != null;
}

/**
 * Downsampled [lng, lat] pairs for map replay — not the canonical record
 * store. Returns [] for route-less activities (e.g. Garmin imports via
 * HealthKit, which carry no GPS route) rather than producing NaN pairs.
 */
export function buildActivityPolyline(
  records: ActivityRecord[],
  maxPoints = DEFAULT_MAX_POINTS,
): ActivityPolylinePoint[] {
  const geoRecords = records.filter(hasCoordinates);
  if (geoRecords.length === 0) return [];

  if (geoRecords.length <= maxPoints) {
    return geoRecords.map((record) => [record.longitude, record.latitude]);
  }

  const polyline: ActivityPolylinePoint[] = [];
  const step = (geoRecords.length - 1) / (maxPoints - 1);

  for (let index = 0; index < maxPoints; index += 1) {
    const record = geoRecords[Math.round(index * step)];
    polyline.push([record.longitude, record.latitude]);
  }

  return polyline;
}
