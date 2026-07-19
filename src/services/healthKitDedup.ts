/** Same-run cross-posting guard (e.g. Garmin → Strava → both into Apple Health). */
const DUPLICATE_TIME_TOLERANCE_MS = 5 * 60 * 1000;
const DUPLICATE_DISTANCE_TOLERANCE_RATIO = 0.15;

export type DedupCandidate = {
  startedAt: Date;
  distanceMeters: number;
};

/**
 * True when `candidate` likely represents the same physical run as one of
 * `existing` — close start time AND close distance. Catches the same run
 * cross-posted into Health by multiple apps (each writes its own separate
 * HKWorkout with a different UUID, so UUID-based dedup alone won't catch it).
 */
export function isDuplicateOfExisting(candidate: DedupCandidate, existing: DedupCandidate[]): boolean {
  return existing.some((entry) => {
    const timeDiffMs = Math.abs(candidate.startedAt.getTime() - entry.startedAt.getTime());
    if (timeDiffMs > DUPLICATE_TIME_TOLERANCE_MS) return false;

    if (candidate.distanceMeters === 0 && entry.distanceMeters === 0) return true;

    const largerDistance = Math.max(candidate.distanceMeters, entry.distanceMeters, 1);
    const distanceDiff = Math.abs(candidate.distanceMeters - entry.distanceMeters);
    return distanceDiff / largerDistance <= DUPLICATE_DISTANCE_TOLERANCE_RATIO;
  });
}
