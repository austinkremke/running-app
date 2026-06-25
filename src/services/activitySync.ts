import { totalDistanceMeters, totalElapsedSeconds } from './activityMetrics';
import { buildActivityPolyline } from './activityPolyline';
import { supabase } from './supabase';
import type { StoredActivity } from '../types/activity';
import type { TablesInsert } from '../types/database';
import {
  clearActivityPendingSync,
  markActivityPendingSync,
  readPendingActivitySyncIds,
} from '../storage/activitySyncQueue';
import { getActivity } from '../storage/activityStorage';

export type ActivitySyncResult =
  | { ok: true; activityId: string }
  | { ok: false; activityId: string; error: string };

function trackStoragePath(userId: string, activityId: string): string {
  return `${userId}/${activityId}/track.json`;
}

function toActivityRow(activity: StoredActivity, userId: string): TablesInsert<'activities'> {
  const { session, records, summary } = activity;

  return {
    id: session.id,
    user_id: userId,
    started_at: session.startedAt,
    ended_at: session.endedAt ?? null,
    distance_meters: totalDistanceMeters(records),
    duration_seconds: Math.round(totalElapsedSeconds(records)),
    source: session.source,
    external_id: session.externalId ?? null,
    external_source: session.externalSource ?? null,
    match_id: session.matchId ?? null,
    summary_json: summary,
    polyline: buildActivityPolyline(records),
    track_storage_path: trackStoragePath(userId, session.id),
  };
}

async function uploadActivityTrack(
  userId: string,
  activity: StoredActivity,
): Promise<void> {
  if (!supabase || activity.records.length === 0) return;

  const path = trackStoragePath(userId, activity.session.id);
  const body = JSON.stringify({
    session: activity.session,
    records: activity.records,
  });
  const bytes = new TextEncoder().encode(body);

  const { error } = await supabase.storage.from('activities').upload(path, bytes, {
    contentType: 'application/json',
    upsert: true,
  });

  if (error) throw error;
}

export async function syncActivityToServer(
  activity: StoredActivity,
  userId: string,
): Promise<ActivitySyncResult> {
  if (!supabase) {
    return { ok: false, activityId: activity.session.id, error: 'Supabase is not configured.' };
  }

  const activityId = activity.session.id;

  try {
    const row = toActivityRow(activity, userId);
    const { error: upsertError } = await supabase.from('activities').upsert(row, {
      onConflict: 'id',
    });

    if (upsertError) throw upsertError;

    await uploadActivityTrack(userId, activity);
    await clearActivityPendingSync(activityId);

    return { ok: true, activityId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activity sync failed.';
    await markActivityPendingSync(activityId);
    return { ok: false, activityId, error: message };
  }
}

export async function syncActivityById(
  activityId: string,
  userId: string,
): Promise<ActivitySyncResult> {
  const activity = await getActivity(activityId);
  if (!activity) {
    await clearActivityPendingSync(activityId);
    return { ok: false, activityId, error: 'Activity not found locally.' };
  }

  return syncActivityToServer(activity, userId);
}

export async function flushPendingActivitySync(userId: string): Promise<ActivitySyncResult[]> {
  const pendingIds = await readPendingActivitySyncIds();
  const results: ActivitySyncResult[] = [];

  for (const activityId of pendingIds) {
    results.push(await syncActivityById(activityId, userId));
  }

  return results;
}

export async function listServerActivities(userId: string, limit = 50) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
