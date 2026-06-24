import type { GpsPoint } from '../maps/types';

const MAX_ACCURACY_METERS = 50;
const MAX_SPEED_MPS = 12; // ~27 mph

export function isUsableGpsPoint(point: GpsPoint, previous?: GpsPoint): boolean {
  if (point.accuracy != null && point.accuracy > MAX_ACCURACY_METERS) {
    return false;
  }

  if (!previous) return true;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(point.latitude - previous.latitude);
  const dLon = toRad(point.longitude - previous.longitude);
  const lat1 = toRad(previous.latitude);
  const lat2 = toRad(point.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const segmentMeters = 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));

  const elapsedSeconds =
    (new Date(point.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1000;

  if (elapsedSeconds > 0 && segmentMeters / elapsedSeconds > MAX_SPEED_MPS) {
    return false;
  }

  return true;
}

export function elapsedSeconds(
  startedAt: string,
  pausedDurationMs: number,
  nowMs = Date.now(),
): number {
  const startedMs = new Date(startedAt).getTime();
  return Math.max(0, Math.floor((nowMs - startedMs - pausedDurationMs) / 1000));
}
