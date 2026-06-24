import type { GpsPoint } from '../maps/types';

const EARTH_RADIUS_M = 6371000;
const METERS_PER_MILE = 1609.344;

export type LatLng = Pick<GpsPoint, 'latitude' | 'longitude'>;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pathDistanceMeters(points: LatLng[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += haversineMeters(points[index - 1], points[index]);
  }
  return total;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

export function formatDistanceMiles(meters: number): string {
  return metersToMiles(meters).toFixed(2);
}

export function formatDurationClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationParts(seconds: number): { value: string; unit: string } {
  const total = Math.max(0, Math.floor(seconds));
  if (total >= 3600) {
    return { value: formatDurationClock(total), unit: 'hr' };
  }
  return { value: formatDurationClock(total), unit: 'min' };
}

export function formatPace(secondsPerMile: number): string {
  if (!Number.isFinite(secondsPerMile) || secondsPerMile <= 0) {
    return '0:00';
  }

  const total = Math.round(secondsPerMile);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
