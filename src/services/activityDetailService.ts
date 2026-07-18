import type { PostRunSummary } from '../mock';
import type { Tables } from '../types/database';
import { supabase } from './supabase';

export type RunExtras = {
  activityId: string;
  activityUserId: string;
  matchId: string | null;
  startedAt: string;
  dateLabel: string;
  summary: PostRunSummary | null;
  trackStoragePath: string | null;
};

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function summaryFromActivity(activity: Tables<'activities'>): PostRunSummary | null {
  if (!activity.summary_json || typeof activity.summary_json !== 'object') {
    return null;
  }

  const summary = activity.summary_json as unknown as PostRunSummary;
  if (typeof summary.distanceMiles !== 'number') {
    return null;
  }

  return summary;
}

/**
 * Detail extras for a feed post's activity — the fields the feed `Run` drops
 * (charts/splits summary, match link, owner + absolute date). The caller
 * already has the `Run` for header/map/engagement, so this only augments it.
 *
 * Accepts either a `feed_posts.id` (the normal feed-tap path) or, when no
 * feed post exists for the run (e.g. a match activity that was never
 * published to the feed), an `activities.id` directly.
 */
export async function fetchRunExtras(feedPostOrActivityId: string): Promise<RunExtras | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('feed_posts')
    .select('activities:activity_id (*)')
    .eq('id', feedPostOrActivityId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  let activity = (data?.activities ?? null) as Tables<'activities'> | null;

  if (!activity) {
    const { data: activityRow, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', feedPostOrActivityId)
      .maybeSingle();

    if (activityError) {
      throw activityError;
    }

    activity = activityRow;
  }

  if (!activity) {
    return null;
  }

  return {
    activityId: activity.id,
    activityUserId: activity.user_id,
    matchId: activity.match_id ?? null,
    startedAt: activity.started_at,
    dateLabel: formatDateLabel(activity.started_at),
    summary: summaryFromActivity(activity),
    trackStoragePath: activity.track_storage_path,
  };
}

export async function deleteActivity(activityId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('delete_activity', { p_activity_id: activityId });
  if (error) {
    throw error;
  }
}
