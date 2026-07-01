/** Minimum distance (meters) for a run to count toward match score — 0.1 mi. */
export const MATCH_MIN_DISTANCE_METERS = 160.934;

/** Mirrors `match_points_for_distance` in Postgres. */
export function matchPointsForDistanceMeters(distanceMeters: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < MATCH_MIN_DISTANCE_METERS) {
    return 0;
  }

  const miles = distanceMeters / 1609.34;
  return Math.max(1, Math.round(miles * 10));
}

export function formatMatchDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '--';
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatMatchDistanceMiles(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return '0.0 mi';
  }

  return `${(distanceMeters / 1609.34).toFixed(1)} mi`;
}
