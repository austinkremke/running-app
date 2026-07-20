import { buildActivityPolyline } from './activityPolyline';
import { buildPostRunSummary } from './buildPostRunSummary';
import { isDuplicateOfExisting } from './healthKitDedup';
import {
  buildActivityRecordsForWorkout,
  fetchRecentHealthKitWorkoutProxies,
  summarizeHealthKitWorkout,
} from './healthKitService';
import { computeVerificationTier } from './healthKitVerification';
import { fetchActiveSoloMatchId } from './matchService';
import { supabase } from './supabase';
import type { ActivityExternalSource, ActivitySession, StoredActivity } from '../types/activity';
import type { TablesInsert } from '../types/database';

/** How far back to pull workouts — matches the verification tier's own recency window, no point fetching further. */
const SYNC_WINDOW_DAYS = 7;
/** Widen the dedup comparison a bit beyond the sync window in case an older duplicate already exists. */
const DEDUP_LOOKBACK_DAYS = 14;
/**
 * Skips obviously-junk HKWorkouts — e.g. a Watch workout started and stopped
 * within seconds while testing — that would otherwise each land as their own
 * tiny "activity" on every sync. Real runs are well above both thresholds.
 */
const MIN_SYNCABLE_DISTANCE_METERS = 100;
const MIN_SYNCABLE_DURATION_SECONDS = 60;
/**
 * A run this stale is almost certainly a backfill/forgotten sync, not "just
 * finished" — don't import it. Widened in dev builds so test runs made
 * during a debugging session (which can span more than a day) are still
 * syncable without loosening the real production cutoff.
 */
const MAX_IMPORT_AGE_HOURS = __DEV__ ? 24 * 7 : 24;

/** A synced activity awaiting the user's "Lock in your run" confirmation — same shape PostRunScreen already renders, plus enough to label the feed post once confirmed. */
export type PendingSyncedActivity = StoredActivity & { sourceName: string };

export type HealthKitSyncResult = {
  syncedCount: number;
  skippedDuplicateCount: number;
  skippedTooShortCount: number;
  skippedTooOldCount: number;
  errorCount: number;
  /**
   * One entry per newly-synced activity, in sync order — neither XP nor the
   * feed post happen here. Both wait for the user to confirm via the same
   * "Lock in your run" screen a phone-tracked run goes through
   * (PendingActivityConfirmationProvider), one activity at a time. The
   * `activities` row and match credit are still written automatically above
   * (mirrors a phone-tracked run: stopRun() already syncs+credits before
   * Lock-In is ever shown — only the feed post and XP wait for confirmation).
   */
  syncedActivities: PendingSyncedActivity[];
};

function trackStoragePath(userId: string, activityId: string): string {
  return `${userId}/${activityId}/track.json`;
}

/**
 * Only credits a synced run to the match that was actually active while the
 * run happened — not whatever match happens to be active right now. Without
 * this, a run synced late (e.g. the next day, after that match already ended
 * and a new one started) would get credited to the new match instead of
 * being correctly excluded, which could flip a match's outcome after the
 * fact. `fetchActiveSoloMatchId` already returns null once a match's own
 * ends_at has passed (it finalizes due matches internally), which handles
 * "synced after the match ended" — this additionally guards against
 * "synced after a *new* match started".
 */
async function creditableSoloMatchIdForRun(userId: string, runEndedAt: Date): Promise<string | null> {
  if (!supabase) return null;

  const matchId = await fetchActiveSoloMatchId(userId).catch(() => null);
  if (!matchId) return null;

  const { data: match } = await supabase
    .from('matches')
    .select('created_at, ends_at')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) return null;

  const matchStart = new Date(match.created_at).getTime();
  const matchEnd = new Date(match.ends_at).getTime();
  const runEndMs = runEndedAt.getTime();

  return runEndMs >= matchStart && runEndMs <= matchEnd ? matchId : null;
}

function externalSourceFromAppName(sourceName: string): ActivityExternalSource | undefined {
  const lower = sourceName.toLowerCase();
  if (lower.includes('garmin') || lower.includes('connect')) return 'garmin';
  if (lower.includes('strava')) return 'strava';
  if (lower.includes('watch')) return 'apple-watch';
  return undefined;
}

async function uploadWorkoutTrack(userId: string, activityId: string, records: unknown): Promise<void> {
  if (!supabase) return;

  const path = trackStoragePath(userId, activityId);
  const body = JSON.stringify({ records });
  const bytes = new TextEncoder().encode(body);

  const { error } = await supabase.storage.from('activities').upload(path, bytes, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) throw error;
}

/**
 * Pulls recent HealthKit workouts, maps them into ActivityRecord[], computes
 * their verification tier, and writes them into `activities` + credits any
 * currently-active match — same as a phone-tracked run's stopRun(), which
 * already does both before the user ever sees "Lock in your run". Match
 * credit is additionally gated server-side on verification_status (see the
 * migration gating award_run_xp / credit_match_activity).
 *
 * The feed post and XP award are deliberately NOT done here — see
 * `syncedActivities` on the return type. The caller (currently
 * `SettingsScreen`, eventually a background-sync trigger too) hands that
 * list to `PendingActivityConfirmationProvider`, which shows the same
 * "Lock in your run" screen a phone-tracked run gets, one activity at a
 * time — confirming is what triggers the feed post + XP drawer.
 *
 * Cross-posting guard: skips a workout if an existing activity (any source)
 * has a close start time + close distance, since the same physical run can
 * land in Health twice via different apps (e.g. Garmin and Strava both
 * syncing to Apple Health) — each writes its own separate HKWorkout, so
 * UUID-based dedup alone wouldn't catch it.
 */
export async function syncHealthKitWorkouts(userId: string): Promise<HealthKitSyncResult> {
  if (!supabase) {
    return {
      syncedCount: 0,
      skippedDuplicateCount: 0,
      skippedTooShortCount: 0,
      skippedTooOldCount: 0,
      errorCount: 0,
      syncedActivities: [],
    };
  }

  const syncSince = new Date(Date.now() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const dedupSince = new Date(Date.now() - DEDUP_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const [workouts, { data: existingActivities, error: existingError }] = await Promise.all([
    fetchRecentHealthKitWorkoutProxies(50, syncSince),
    supabase
      .from('activities')
      .select('id, started_at, distance_meters')
      .eq('user_id', userId)
      .gte('started_at', dedupSince.toISOString()),
  ]);

  if (existingError) throw existingError;

  const existingByStartAndDistance = (existingActivities ?? []).map((row) => ({
    id: row.id,
    startedAt: new Date(row.started_at),
    distanceMeters: row.distance_meters ?? 0,
  }));

  let syncedCount = 0;
  let skippedDuplicateCount = 0;
  let skippedTooShortCount = 0;
  let skippedTooOldCount = 0;
  let errorCount = 0;
  const syncedActivities: PendingSyncedActivity[] = [];

  for (const workout of workouts) {
    try {
      const summary = summarizeHealthKitWorkout(workout);

      if (
        (summary.distanceMeters ?? 0) < MIN_SYNCABLE_DISTANCE_METERS ||
        summary.durationSeconds < MIN_SYNCABLE_DURATION_SECONDS
      ) {
        skippedTooShortCount += 1;
        continue;
      }

      const hoursSinceEnded = (Date.now() - summary.endDate.getTime()) / (60 * 60 * 1000);
      if (hoursSinceEnded > MAX_IMPORT_AGE_HOURS) {
        skippedTooOldCount += 1;
        continue;
      }

      // Case-insensitive: HealthKit UUIDs come back uppercase, Postgres returns uuid columns lowercase.
      const alreadyImportedById = existingByStartAndDistance.some(
        (e) => e.id.toLowerCase() === workout.uuid.toLowerCase(),
      );

      if (!alreadyImportedById) {
        const isDuplicate = isDuplicateOfExisting(
          { startedAt: summary.startDate, distanceMeters: summary.distanceMeters ?? 0 },
          existingByStartAndDistance,
        );
        if (isDuplicate) {
          skippedDuplicateCount += 1;
          continue;
        }
      }

      const records = await buildActivityRecordsForWorkout(workout);
      const { tier } = computeVerificationTier({
        wasUserEntered: summary.wasUserEntered,
        workoutEnd: summary.endDate,
        records,
      });

      const session: ActivitySession = {
        id: workout.uuid,
        status: 'completed',
        startedAt: summary.startDate.toISOString(),
        endedAt: summary.endDate.toISOString(),
        pausedDurationMs: 0,
        source: 'healthkit',
        externalId: workout.uuid,
        externalSource: externalSourceFromAppName(summary.sourceName),
      };

      const postRunSummary = buildPostRunSummary(session, records, session.endedAt!);
      const matchId = await creditableSoloMatchIdForRun(userId, summary.endDate);

      const importMetadata = {
        sourceName: summary.sourceName,
        wasUserEntered: summary.wasUserEntered,
        recordCount: records.length,
        heartRateRecordCount: records.filter((r) => r.heartRateBpm != null).length,
        hasRoute: records.some((r) => r.latitude != null),
      };

      const row: TablesInsert<'activities'> = {
        id: workout.uuid,
        user_id: userId,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        distance_meters: summary.distanceMeters ?? 0,
        duration_seconds: Math.round(summary.durationSeconds),
        source: 'healthkit',
        external_id: workout.uuid,
        external_source: session.externalSource ?? null,
        match_id: matchId,
        summary_json: postRunSummary,
        polyline: buildActivityPolyline(records),
        track_storage_path: trackStoragePath(userId, workout.uuid),
        verification_status: tier,
        import_metadata: importMetadata,
      };

      const { error: upsertError } = await supabase.from('activities').upsert(row, { onConflict: 'id' });
      if (upsertError) throw upsertError;

      await uploadWorkoutTrack(userId, workout.uuid, records);

      if (matchId) {
        try {
          await supabase.rpc('credit_match_activity', { p_activity_id: workout.uuid });
        } catch {
          // Non-fatal — the activity itself already synced successfully.
        }
      }

      existingByStartAndDistance.push({
        id: workout.uuid,
        startedAt: summary.startDate,
        distanceMeters: summary.distanceMeters ?? 0,
      });
      syncedActivities.push({
        session,
        records,
        summary: postRunSummary,
        sourceName: summary.sourceName,
      });
      syncedCount += 1;
    } catch {
      errorCount += 1;
    }
  }

  return {
    syncedCount,
    skippedDuplicateCount,
    skippedTooShortCount,
    skippedTooOldCount,
    errorCount,
    syncedActivities,
  };
}
