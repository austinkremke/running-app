import type { ActivityRecord } from '../types/activity';

export type ActivityPolylinePoint = [longitude: number, latitude: number];

const DEFAULT_MAX_POINTS = 500;

/** Downsampled [lng, lat] pairs for map replay — not the canonical record store. */
export function buildActivityPolyline(
  records: ActivityRecord[],
  maxPoints = DEFAULT_MAX_POINTS,
): ActivityPolylinePoint[] {
  if (records.length === 0) return [];

  if (records.length <= maxPoints) {
    return records.map((record) => [record.longitude, record.latitude]);
  }

  const polyline: ActivityPolylinePoint[] = [];
  const step = (records.length - 1) / (maxPoints - 1);

  for (let index = 0; index < maxPoints; index += 1) {
    const record = records[Math.round(index * step)];
    polyline.push([record.longitude, record.latitude]);
  }

  return polyline;
}
