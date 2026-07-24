import type { FeedTab, Run } from '../mock';
import type { Tables } from '../types/database';
import { syncActivityById } from './activitySync';
import { fetchFeedEngagementSummaries } from './feedEngagementService';
import { fetchFriendIds } from './friendService';
import { supabase } from './supabase';
import { fetchTeammateIds } from './teamService';
import { fetchRankTiers } from './rank/rankService';
import { mapRankTierRow } from './rank/tierFromRating';
import { mapFeedPostToRun } from './socialMappers';

export type CreateFeedPostInput = {
  userId: string;
  activityId: string;
  title?: string;
  description?: string;
  location?: string;
  photoUrl?: string | null;
  audiences?: FeedTab[];
  /** Defaults to now() (a fresh post) — pass the run's own completion time for backdated imports (e.g. HealthKit sync) so the feed doesn't show a months-old run as "just posted". */
  createdAt?: string;
};

export async function createFeedPost(input: CreateFeedPostInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const audiences = input.audiences?.length ? input.audiences : ['community'];

  const { error } = await supabase.from('feed_posts').upsert(
    {
      user_id: input.userId,
      activity_id: input.activityId,
      title: input.title ?? '',
      description: input.description ?? '',
      location: input.location ?? '',
      photo_url: input.photoUrl ?? null,
      audiences,
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    },
    { onConflict: 'activity_id' },
  );

  if (error) throw error;
}

export async function publishActivityToFeed(input: CreateFeedPostInput): Promise<void> {
  const syncResult = await syncActivityById(input.activityId, input.userId);
  if (!syncResult.ok) {
    throw new Error(`Could not sync run before posting: ${syncResult.error}`);
  }

  await createFeedPost(input);
}

/** Fetches a single run (as the feed-card `Run` shape RunDetailScreen expects) by its
 * underlying `activities.id` — used when navigating to run detail from a surface that
 * only has an activity id (e.g. All-Time Bests), not a `Run` already loaded in a feed list. */
export async function fetchRunByActivityId(
  activityId: string,
  viewerUserId: string | null = null,
): Promise<Run | null> {
  if (!supabase) return null;

  const [{ data, error }, rankTierRows] = await Promise.all([
    supabase
      .from('feed_posts')
      .select(
        `
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url,
          team_id,
          player_progress (total_xp),
          player_rank (competitive_rating),
          teams:team_id (name)
        ),
        activities:activity_id (*)
      `,
      )
      .eq('activity_id', activityId)
      .maybeSingle(),
    fetchRankTiers(),
  ]);

  if (error) throw error;
  if (!data) return null;

  const rankTiers = rankTierRows.map(mapRankTierRow);
  const profile = data.profiles as
    | (Tables<'profiles'> & {
        player_progress?: { total_xp: number } | { total_xp: number }[] | null;
        player_rank?: { competitive_rating: number } | { competitive_rating: number }[] | null;
        teams?: { name: string } | { name: string }[] | null;
      })
    | null;
  const activity = data.activities as Tables<'activities'> | null;
  if (!profile || !activity) return null;

  const progress = Array.isArray(profile.player_progress) ? profile.player_progress[0] : profile.player_progress;
  const rank = Array.isArray(profile.player_rank) ? profile.player_rank[0] : profile.player_rank;
  const teamRecord = profile.teams;
  const teamName = Array.isArray(teamRecord) ? teamRecord[0]?.name : teamRecord?.name;
  const engagementByPostId = await fetchFeedEngagementSummaries([data.id], viewerUserId);
  const engagement = engagementByPostId[data.id] ?? { likeCount: 0, commentCount: 0, likedByMe: false };

  return mapFeedPostToRun(
    data,
    { ...profile, player_progress: progress ?? null, player_rank: rank ?? null },
    activity,
    teamName ?? null,
    engagement,
    rankTiers,
  );
}

export async function fetchFeedPosts(
  tab: FeedTab,
  viewerUserId: string | null = null,
  limit = 50,
): Promise<Run[]> {
  if (!supabase) return [];

  // RLS on feed_posts is permissive (OR'd) across policies: a post tagged both
  // 'community' and 'team' is also readable via feed_posts_select_community,
  // which has no team/friend restriction at all. So audience-scoped tabs must
  // also restrict client-side by author id — RLS alone does not enforce it.
  let scopedUserIds: string[] | null = null;
  if (tab === 'friends') {
    if (!viewerUserId) {
      return [];
    }

    scopedUserIds = await fetchFriendIds(viewerUserId);
    if (scopedUserIds.length === 0) {
      return [];
    }
  } else if (tab === 'team') {
    if (!viewerUserId) {
      return [];
    }

    scopedUserIds = await fetchTeammateIds(viewerUserId);
    if (scopedUserIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from('feed_posts')
    .select(
      `
      *,
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        team_id,
        player_progress (total_xp),
        player_rank (competitive_rating),
        teams:team_id (name)
      ),
      activities:activity_id (*)
    `,
    )
    .contains('audiences', [tab])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (scopedUserIds) {
    query = query.in('user_id', scopedUserIds);
  }

  const [{ data, error }, rankTierRows] = await Promise.all([query, fetchRankTiers()]);
  const rankTiers = rankTierRows.map(mapRankTierRow);

  if (error) throw error;
  if (!data) return [];

  const postIds = data.map((row) => row.id);
  const engagementByPostId = await fetchFeedEngagementSummaries(postIds, viewerUserId);

  return data
    .map((row) => {
      const profile = row.profiles as
        | (Tables<'profiles'> & {
            player_progress?: { total_xp: number } | { total_xp: number }[] | null;
            player_rank?: { competitive_rating: number } | { competitive_rating: number }[] | null;
            teams?: { name: string } | { name: string }[] | null;
          })
        | null;
      const activity = row.activities as Tables<'activities'> | null;
      if (!profile || !activity) return null;

      const progress = Array.isArray(profile.player_progress)
        ? profile.player_progress[0]
        : profile.player_progress;
      const rank = Array.isArray(profile.player_rank)
        ? profile.player_rank[0]
        : profile.player_rank;
      const teamRecord = profile.teams;
      const teamName = Array.isArray(teamRecord) ? teamRecord[0]?.name : teamRecord?.name;
      const engagement = engagementByPostId[row.id] ?? {
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
      };

      return mapFeedPostToRun(
        row,
        { ...profile, player_progress: progress ?? null, player_rank: rank ?? null },
        activity,
        teamName ?? null,
        engagement,
        rankTiers,
      );
    })
    .filter((run): run is Run => run !== null);
}
