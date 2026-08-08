import type { TeamLogoAccent } from '../mock';
import { levelFromTotalXp } from './levelCurve';
import { supabase } from './supabase';
import type { FollowSearchResult } from './followService';
import { fetchFollowingIds } from './followService';
import { fetchRankTiers } from './rank/rankService';
import { mapRankTierRow, tierFromRating } from './rank/tierFromRating';

export type TeamNotificationKind = 'invite' | 'request';

export type TeamNotification = {
  id: string;
  kind: TeamNotificationKind;
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogoIcon: string;
  teamLogoAccent: TeamLogoAccent;
  teamLogoUrl?: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl?: string;
  actorLevel: number;
  createdAt: string;
};

const LOGO_ACCENTS = new Set<TeamLogoAccent>(['lime', 'purple', 'gold', 'silver', 'cyan', 'blue']);

function asLogoAccent(value: unknown): TeamLogoAccent {
  return typeof value === 'string' && LOGO_ACCENTS.has(value as TeamLogoAccent)
    ? (value as TeamLogoAccent)
    : 'lime';
}

function parseNotification(payload: unknown): TeamNotification | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const row = payload as Record<string, unknown>;
  const id = row.id;
  const kind = row.kind;

  if (typeof id !== 'string' || (kind !== 'invite' && kind !== 'request')) {
    return null;
  }

  return {
    id,
    kind,
    teamId: typeof row.team_id === 'string' ? row.team_id : '',
    teamName: typeof row.team_name === 'string' ? row.team_name : 'Team',
    teamTag: typeof row.team_tag === 'string' ? row.team_tag : '',
    teamLogoIcon: typeof row.team_logo_icon === 'string' ? row.team_logo_icon : 'paw',
    teamLogoAccent: asLogoAccent(row.team_logo_accent),
    teamLogoUrl: typeof row.team_logo_url === 'string' ? row.team_logo_url : undefined,
    actorId: typeof row.actor_id === 'string' ? row.actor_id : '',
    actorName: typeof row.actor_name === 'string' ? row.actor_name : 'Runner',
    actorAvatarUrl: typeof row.actor_avatar_url === 'string' ? row.actor_avatar_url : undefined,
    actorLevel: typeof row.actor_level === 'number' ? row.actor_level : 0,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

export async function fetchTeamNotifications(): Promise<TeamNotification[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_team_notifications');
  if (error) {
    throw error;
  }

  const list = Array.isArray(data) ? data : [];
  return list
    .map((entry) => parseNotification(entry))
    .filter((entry): entry is TeamNotification => entry !== null);
}

export async function hasTeamNotifications(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc('has_team_notifications');
  if (error) {
    throw error;
  }

  return data === true;
}

export async function inviteToTeam(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('invite_to_team', { p_user_id: userId });
  if (error) {
    throw error;
  }
}

export async function requestToJoinTeam(teamId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('request_to_join_team', { p_team_id: teamId });
  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as { status?: string };
  return payload.status ?? 'requested';
}

export async function respondToTeamInvite(requestId: string, accept: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('respond_to_team_invite', {
    p_request_id: requestId,
    p_accept: accept,
  });
  if (error) {
    throw error;
  }
}

export async function respondToJoinRequest(requestId: string, accept: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('respond_to_join_request', {
    p_request_id: requestId,
    p_accept: accept,
  });
  if (error) {
    throw error;
  }
}

export async function cancelTeamMembershipRequest(requestId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('cancel_team_membership_request', {
    p_request_id: requestId,
  });
  if (error) {
    throw error;
  }
}

function mapProfileRow(row: Record<string, unknown>, tiers: ReturnType<typeof mapRankTierRow>[]): FollowSearchResult {
  const progress = Array.isArray(row.player_progress) ? row.player_progress[0] : row.player_progress;
  const rank = Array.isArray(row.player_rank) ? row.player_rank[0] : row.player_rank;
  const rating = (rank as { competitive_rating?: number } | null)?.competitive_rating;
  const tier = rating != null && tiers.length > 0 ? tierFromRating(rating, tiers) : undefined;

  return {
    id: String(row.id),
    displayName: typeof row.display_name === 'string' ? row.display_name : 'Runner',
    avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : undefined,
    level: levelFromTotalXp((progress as { total_xp?: number } | null)?.total_xp ?? 0),
    teamName: 'No team',
    rankTierId: tier?.id,
    rankTitle: tier?.displayName,
    competitiveRating: rating,
  };
}

/** People this user follows who aren't currently on any team — the default invite candidates. */
export async function fetchInvitableFollowing(userId: string): Promise<FollowSearchResult[]> {
  if (!supabase) {
    return [];
  }

  const followingIds = await fetchFollowingIds(userId);
  if (followingIds.length === 0) {
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
      team_id,
      player_progress (total_xp),
      player_rank (competitive_rating)
    `,
    )
    .in('id', followingIds)
    .is('team_id', null)
    .order('display_name');

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapProfileRow(row as Record<string, unknown>, tiers));
}

/** Search all teamless users by name for the invite drawer. */
export async function searchInvitableUsers(
  query: string,
  viewerUserId: string,
  limit = 20,
): Promise<FollowSearchResult[]> {
  if (!supabase) {
    return [];
  }

  const sanitized = query.trim().replace(/[%_]/g, '').slice(0, 40);
  if (sanitized.length < 2) {
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
      team_id,
      player_progress (total_xp),
      player_rank (competitive_rating)
    `,
    )
    .ilike('display_name', `%${sanitized}%`)
    .is('team_id', null)
    .neq('id', viewerUserId)
    .order('display_name')
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapProfileRow(row as Record<string, unknown>, tiers));
}
