import type { PostRunSummary } from '../mock';

/** Where activity samples originated — extensible for import/export adapters. */
export type ActivitySource = 'phone-gps' | 'mock' | 'garmin-fit' | 'strava' | 'gpx' | 'healthkit';

export type ActivityExternalSource = 'garmin' | 'strava' | 'apple-watch';

export type ActivityStatus = 'recording' | 'paused' | 'completed' | 'cancelled';

/**
 * One time-series sample (Garmin FIT `record` / Strava stream row / HealthKit sample).
 * `distanceMeters` is cumulative from activity start.
 *
 * `latitude`/`longitude` are nullable — HealthKit workouts synced from Garmin
 * carry no HKWorkoutRoute (Garmin does not write routes to Apple Health), so
 * those records exist with pace/HR/distance data but no coordinates.
 */
export type ActivityRecord = {
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number;
  elapsedSeconds: number;
  movingSeconds?: number;
  altitudeMeters?: number | null;
  speedMps?: number | null;
  heartRateBpm?: number | null;
  accuracyMeters?: number | null;
  source: ActivitySource;
};

/** Activity-level metadata (Garmin FIT `session` / Strava activity summary). */
export type ActivitySession = {
  id: string;
  status: ActivityStatus;
  startedAt: string;
  endedAt?: string;
  pausedDurationMs: number;
  source: ActivitySource;
  /** Set when imported or synced from an external platform. */
  externalId?: string;
  externalSource?: ActivityExternalSource;
  matchId?: string;
};

/** Persisted activity — records are the source of truth; summary is derived. */
export type StoredActivity = {
  session: ActivitySession;
  records: ActivityRecord[];
  summary: PostRunSummary;
};

export type FinishedActivity = StoredActivity;
