import type { ResolvedRankTier } from '../types/rank';
import { levelFromTotalXp } from './levelCurve';
import { fetchRankTiers } from './rank/rankService';
import { mapRankTierRow, tierFromRating } from './rank/tierFromRating';
import { supabase } from './supabase';

export type FriendProfile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  teamName: string;
};

export type FriendSearchResult = FriendProfile & {
  rankTierId?: string;
  rankTitle?: string;
  competitiveRating?: number;
};

export function sanitizeFriendSearchQuery(query: string): string {
  return query.trim().replace(/[%_]/g, '').slice(0, 40);
}

export async function fetchFriendIds(userId: string): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('friend_user_id')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.friend_user_id);
}

export async function fetchFriendProfilesForChallenge(userId: string): Promise<FriendSearchResult[]> {
  if (!supabase) {
    return [];
  }

  const friendIds = await fetchFriendIds(userId);
  if (friendIds.length === 0) {
    return [];
  }

  const tiers = (await fetchRankTiers()).map(mapRankTierRow);

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      display_name,
      avatar_url,
      player_progress (total_xp),
      player_rank (competitive_rating),
      teams:team_id (name)
    `,
    )
    .in('id', friendIds)
    .order('display_name');

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const progress = Array.isArray(row.player_progress)
      ? row.player_progress[0]
      : row.player_progress;
    const rank = Array.isArray(row.player_rank) ? row.player_rank[0] : row.player_rank;
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    const rating = rank?.competitive_rating;
    const tier =
      rating != null && tiers.length > 0 ? tierFromRating(rating, tiers) : undefined;

    return {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url ?? undefined,
      level: levelFromTotalXp(progress?.total_xp ?? 0),
      teamName: team?.name ?? 'No team',
      rankTierId: tier?.id,
      rankTitle: tier?.displayName,
      competitiveRating: rating,
    };
  });
}

export async function addFriend(friendUserId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('add_friend', {
    p_friend_user_id: friendUserId,
  });

  if (error) {
    throw error;
  }
}

export async function removeFriend(friendUserId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('remove_friend', {
    p_friend_user_id: friendUserId,
  });

  if (error) {
    throw error;
  }
}

export async function isFriend(userId: string, otherUserId: string): Promise<boolean> {
  if (!supabase || userId === otherUserId) {
    return false;
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('friend_user_id')
    .eq('user_id', userId)
    .eq('friend_user_id', otherUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function searchProfiles(
  query: string,
  viewerUserId: string,
  rankTiers: ResolvedRankTier[] = [],
  limit = 20,
): Promise<FriendSearchResult[]> {
  if (!supabase) {
    return [];
  }

  const sanitized = sanitizeFriendSearchQuery(query);
  if (sanitized.length < 2) {
    return [];
  }

  const tiers = rankTiers.length > 0 ? rankTiers : (await fetchRankTiers()).map(mapRankTierRow);

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      display_name,
      avatar_url,
      player_progress (total_xp),
      player_rank (competitive_rating),
      teams:team_id (name)
    `,
    )
    .ilike('display_name', `%${sanitized}%`)
    .neq('id', viewerUserId)
    .order('display_name')
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const progress = Array.isArray(row.player_progress)
      ? row.player_progress[0]
      : row.player_progress;
    const rank = Array.isArray(row.player_rank) ? row.player_rank[0] : row.player_rank;
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    const rating = rank?.competitive_rating;
    const tier =
      rating != null && tiers.length > 0 ? tierFromRating(rating, tiers) : undefined;

    return {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url ?? undefined,
      level: levelFromTotalXp(progress?.total_xp ?? 0),
      teamName: team?.name ?? 'No team',
      rankTierId: tier?.id,
      rankTitle: tier?.displayName,
      competitiveRating: rating,
    };
  });
}
