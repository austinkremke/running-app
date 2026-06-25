import type { FeedTab, Run } from '../mock';
import type { Tables } from '../types/database';
import { syncActivityById } from './activitySync';
import { supabase } from './supabase';
import { mapFeedPostToRun } from './socialMappers';

export type CreateFeedPostInput = {
  userId: string;
  activityId: string;
  title?: string;
  description?: string;
  location?: string;
  photoUrl?: string | null;
  audiences?: FeedTab[];
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

export async function fetchFeedPosts(tab: FeedTab, limit = 50): Promise<Run[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
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
        teams:team_id (name)
      ),
      activities:activity_id (*)
    `,
    )
    .contains('audiences', [tab])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data) return [];

  return data
    .map((row) => {
      const profile = row.profiles as
        | (Tables<'profiles'> & {
            player_progress?: { total_xp: number } | { total_xp: number }[] | null;
            teams?: { name: string } | { name: string }[] | null;
          })
        | null;
      const activity = row.activities as Tables<'activities'> | null;
      if (!profile || !activity) return null;

      const progress = Array.isArray(profile.player_progress)
        ? profile.player_progress[0]
        : profile.player_progress;
      const teamRecord = profile.teams;
      const teamName = Array.isArray(teamRecord) ? teamRecord[0]?.name : teamRecord?.name;

      return mapFeedPostToRun(
        row,
        { ...profile, player_progress: progress ?? null },
        activity,
        teamName ?? null,
      );
    })
    .filter((run): run is Run => run !== null);
}
