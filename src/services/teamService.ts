import type { Team, TopTeamListing } from '../mock';
import type { Tables } from '../types/database';
import { supabase } from './supabase';
import {
  mapTeamListingRow,
  mapTeamMemberRow,
  mapTeamRow,
  ROAD_WARRIORS_TEAM_ID,
} from './socialMappers';

export { ROAD_WARRIORS_TEAM_ID };

type TeamMemberQueryRow = Tables<'team_members'> & {
  profiles: Tables<'profiles'> & {
    player_progress: { total_xp: number } | null;
    player_rank: { competitive_rating: number } | null;
  };
};

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

  const { data: memberRows, error: membersError } = await supabase
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
    .order('joined_at', { ascending: true });

  if (membersError) throw membersError;

  const members = (memberRows ?? []).map((row, index) => {
    const rawProfile = row.profiles as TeamMemberQueryRow['profiles'];
    const progress = Array.isArray(rawProfile.player_progress)
      ? rawProfile.player_progress[0]
      : rawProfile.player_progress;
    const rank = Array.isArray(rawProfile.player_rank)
      ? rawProfile.player_rank[0]
      : rawProfile.player_rank;

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
    );
  });

  return mapTeamRow(team, members, members.length);
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

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!teams?.length) return [];

  const listings = await Promise.all(
    teams.map(async (team) => {
      const client = supabase;
      if (!client) {
        return { team, memberCount: 0 };
      }

      const { count, error: countError } = await client
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      if (countError) throw countError;
      return { team, memberCount: count ?? 0 };
    }),
  );

  return listings
    .sort((a, b) => b.memberCount - a.memberCount || a.team.name.localeCompare(b.team.name))
    .map(({ team, memberCount }, index) => mapTeamListingRow(team, memberCount, index + 1));
}
