/** Minimum distance (meters) for a run to count toward match score — 0.1 mi. */
export const MATCH_MIN_DISTANCE_METERS = 160.934;

/** Reference pace for match scoring — 10:00/mi. Faster than this earns a bonus. */
export const MATCH_REFERENCE_PACE_SEC_PER_MILE = 600;

/** Pace multiplier bounds applied to the distance base score. */
export const MATCH_PACE_MULTIPLIER_MIN = 0.85;
export const MATCH_PACE_MULTIPLIER_MAX = 1.25;

function paceMultiplierForActivity(distanceMeters: number, durationSeconds: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < MATCH_MIN_DISTANCE_METERS) {
    return 1;
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 1;
  }

  const miles = distanceMeters / 1609.34;
  const paceSecPerMile = durationSeconds / miles;
  if (!Number.isFinite(paceSecPerMile) || paceSecPerMile <= 0) {
    return 1;
  }

  const rawMultiplier = MATCH_REFERENCE_PACE_SEC_PER_MILE / paceSecPerMile;
  return Math.min(MATCH_PACE_MULTIPLIER_MAX, Math.max(MATCH_PACE_MULTIPLIER_MIN, rawMultiplier));
}

/** Mirrors `match_points_for_activity` in Postgres. */
export function matchPointsForActivity(
  distanceMeters: number,
  durationSeconds?: number | null,
): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < MATCH_MIN_DISTANCE_METERS) {
    return 0;
  }

  const miles = distanceMeters / 1609.34;
  const basePoints = Math.max(1, Math.round(miles * 10));
  const multiplier = paceMultiplierForActivity(distanceMeters, durationSeconds ?? 0);
  return Math.max(1, Math.round(basePoints * multiplier));
}

/** Distance-only scoring (no pace multiplier). */
export function matchPointsForDistanceMeters(distanceMeters: number): number {
  return matchPointsForActivity(distanceMeters, null);
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
