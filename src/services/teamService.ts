import type { Team, TopTeamListing } from '../mock';
import type { Tables } from '../types/database';
import { fetchRankTiers } from './rank/rankService';
import { mapRankTierRow } from './rank/tierFromRating';
import { supabase } from './supabase';
import {
  mapTeamListingRow,
  mapTeamMemberRow,
  mapTeamRow,
  type TeamOverview,
} from './socialMappers';

type TeamMemberQueryRow = Tables<'team_members'> & {
  profiles: Tables<'profiles'> & {
    player_progress: { total_xp: number } | null;
    player_rank: { competitive_rating: number } | null;
  };
};

type TeamOverviewJson = {
  competitive_rating: number;
  season_wins: number;
  season_losses: number;
  rank_position: number;
  team_count: number;
  week_distance_meters: number;
  total_distance_meters: number;
  member_week: { user_id: string; week_distance_meters: number }[];
};

/** Real aggregates for the Team tab; null when the RPC is unavailable (offline). */
async function fetchTeamOverview(teamId: string): Promise<TeamOverview | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('get_team_overview', { p_team_id: teamId });
    if (error) throw error;

    const raw = data as TeamOverviewJson;
    const memberWeekMeters: Record<string, number> = {};
    for (const entry of raw.member_week ?? []) {
      memberWeekMeters[entry.user_id] = entry.week_distance_meters ?? 0;
    }

    return {
      competitiveRating: raw.competitive_rating,
      seasonWins: raw.season_wins,
      seasonLosses: raw.season_losses,
      rankPosition: raw.rank_position,
      teamCount: raw.team_count,
      weekDistanceMeters: raw.week_distance_meters ?? 0,
      totalDistanceMeters: raw.total_distance_meters ?? 0,
      memberWeekMeters,
    };
  } catch {
    return null;
  }
}

export async function fetchMyTeam(userId: string): Promise<Team | null> {
  if (!supabase) return null;

  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', membership.team_id)
    .maybeSingle();

  if (teamError) throw teamError;
  if (!team) return null;

  const [{ data: memberRows, error: membersError }, overview, tierRows] = await Promise.all([
    supabase
      .from('team_members')
      .select(
        `
      *,
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        player_progress (total_xp),
        player_rank (competitive_rating)
      )
    `,
      )
      .eq('team_id', team.id)
      .order('joined_at', { ascending: true }),
    fetchTeamOverview(team.id),
    fetchRankTiers().catch(() => []),
  ]);

  const tiers = tierRows.map(mapRankTierRow);

  if (membersError) throw membersError;

  let totalMemberXp = 0;

  const members = (memberRows ?? []).map((row, index) => {
    const rawProfile = row.profiles as TeamMemberQueryRow['profiles'];
    const progress = Array.isArray(rawProfile.player_progress)
      ? rawProfile.player_progress[0]
      : rawProfile.player_progress;
    const rank = Array.isArray(rawProfile.player_rank)
      ? rawProfile.player_rank[0]
      : rawProfile.player_rank;

    totalMemberXp += progress?.total_xp ?? 0;

    return mapTeamMemberRow(
      {
        ...row,
        profiles: {
          ...rawProfile,
          player_progress: progress ?? null,
          player_rank: rank ?? null,
        },
      } as TeamMemberQueryRow,
      index + 1,
      overview?.memberWeekMeters[row.user_id] ?? 0,
    );
  });

  return mapTeamRow(team, members, members.length, totalMemberXp, overview, tiers);
}

/** Lightweight team name lookup for profile display (Me tab). */
export async function fetchTeamNameById(teamId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .maybeSingle();

  if (error) throw error;

  return data?.name ?? null;
}

/**
 * Current teammates' user ids (including the caller). `feed_posts_select_team`
 * RLS is not enough on its own to scope the Team feed tab — a post tagged
 * both 'community' and 'team' is also readable via the permissive
 * `feed_posts_select_community` policy, so the client must restrict to
 * teammates explicitly (mirrors how the Friends tab restricts to friend ids).
 */
export async function fetchTeammateIds(userId: string): Promise<string[]> {
  if (!supabase) return [];

  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return [];

  const { data, error } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', membership.team_id);

  if (error) throw error;

  return (data ?? []).map((row) => row.user_id);
}

export async function joinTeam(userId: string, teamId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
    role: 'member',
  });

  if (error) throw error;
}

export async function leaveTeam(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from('team_members').delete().eq('user_id', userId);
  if (error) throw error;
}

export type CreateTeamInput = {
  name: string;
  tag: string;
  motto?: string;
  logoIcon?: string;
  logoAccent?: string;
};

/** Creates a team with the caller as leader. Level-gated server-side (`create_team`, L10). */
export async function createTeam(input: CreateTeamInput): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('create_team', {
    p_name: input.name,
    p_tag: input.tag,
    p_motto: input.motto ?? '',
    p_logo_icon: input.logoIcon ?? 'paw',
    p_logo_accent: input.logoAccent ?? 'lime',
  });

  if (error) throw error;

  return (data as { team_id: string }).team_id;
}

export type UpdateTeamInput = {
  name?: string;
  motto?: string;
  logoIcon?: string;
  logoAccent?: string;
  /** '' clears a custom logo back to the icon/accent avatar; undefined leaves it unchanged. */
  logoUrl?: string;
};

export async function updateTeam(teamId: string, input: UpdateTeamInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('update_team', {
    p_team_id: teamId,
    p_name: input.name ?? undefined,
    p_motto: input.motto ?? undefined,
    p_logo_icon: input.logoIcon ?? undefined,
    p_logo_accent: input.logoAccent ?? undefined,
    p_logo_url: input.logoUrl ?? undefined,
  });

  if (error) throw error;
}

export async function promoteMember(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('promote_member', { p_user_id: userId });
  if (error) throw error;
}

export async function demoteMember(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('demote_member', { p_user_id: userId });
  if (error) throw error;
}

export async function kickMember(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('kick_member', { p_user_id: userId });
  if (error) throw error;
}

export async function transferLeadership(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('transfer_leadership', { p_user_id: userId });
  if (error) throw error;
}

export async function disbandTeam(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('disband_team');
  if (error) throw error;
}

export async function listTopTeams(limit = 50): Promise<TopTeamListing[]> {
  if (!supabase) return [];

  const [{ data, error }, tierRows] = await Promise.all([
    supabase.rpc('list_top_teams', { p_limit: limit }),
    fetchRankTiers().catch(() => []),
  ]);

  if (error) throw error;

  const tiers = tierRows.map(mapRankTierRow);

  return (data ?? []).map((row, index) => mapTeamListingRow(row, index + 1, tiers));
}
