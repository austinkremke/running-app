import type { ActiveSoloMatch, ActiveTeamMatch } from '../mock';
import { MOCK_ACTIVE_SOLO_MATCH } from '../mock/soloActiveMatch';
import { MOCK_ACTIVE_TEAM_MATCH } from '../mock/teamMatch';
import type { Tables } from '../types/database';
import { mapSoloMatchRow, mapTeamMatchRow } from './matchMappers';
import { supabase } from './supabase';

export const DEMO_TEAM_MATCH_ID = '22222222-2222-4222-8222-222222222222';
export const DEMO_SOLO_MATCH_ID = '33333333-3333-4333-8333-333333333333';

type LiveMember = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
};

async function fetchLiveTeamMembers(teamId: string): Promise<LiveMember[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('team_members')
    .select(
      `
      user_id,
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        player_progress (total_xp)
      )
    `,
    )
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = row.profiles as
      | (Tables<'profiles'> & {
          player_progress?: { total_xp: number } | { total_xp: number }[] | null;
        })
      | null;
    const progress = Array.isArray(profile?.player_progress)
      ? profile.player_progress[0]
      : profile?.player_progress;

    return {
      user_id: row.user_id,
      display_name: profile?.display_name ?? 'Runner',
      avatar_url: profile?.avatar_url ?? null,
      total_xp: progress?.total_xp ?? 0,
    };
  });
}

async function fetchUserTeamId(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.team_id ?? null;
}

export async function fetchActiveTeamMatch(userId: string): Promise<ActiveTeamMatch | null> {
  if (!supabase) return null;

  const teamId = await fetchUserTeamId(userId);
  if (!teamId) return null;

  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('kind', 'team')
    .eq('status', 'active')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!match?.home_team_id || !match.away_team_id) return null;

  const [{ data: homeTeam, error: homeError }, { data: awayTeam, error: awayError }] =
    await Promise.all([
      supabase.from('teams').select('*').eq('id', match.home_team_id).maybeSingle(),
      supabase.from('teams').select('*').eq('id', match.away_team_id).maybeSingle(),
    ]);

  if (homeError) throw homeError;
  if (awayError) throw awayError;
  if (!homeTeam || !awayTeam) return null;

  const liveHomeMembers =
    teamId === match.home_team_id ? await fetchLiveTeamMembers(match.home_team_id) : [];

  return mapTeamMatchRow(match, homeTeam, awayTeam, liveHomeMembers);
}

async function ensureSoloParticipant(userId: string, matchId: string): Promise<number> {
  if (!supabase) return 0;

  const { data: existing, error: existingError } = await supabase
    .from('match_participants')
    .select('points')
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing.points;

  const { error: insertError } = await supabase.from('match_participants').insert({
    match_id: matchId,
    user_id: userId,
    side: 'home',
    points: 0,
    lineup_order: 1,
  });

  if (insertError) throw insertError;
  return 0;
}

export async function fetchActiveSoloMatch(userId: string): Promise<ActiveSoloMatch | null> {
  if (!supabase) return null;

  const { data: enrolled, error: enrolledError } = await supabase
    .from('match_participants')
    .select('match_id, points, matches:match_id!inner (id, kind, status, ends_at, state_json, match_type_id, started_at, created_at, updated_at, home_team_id, away_team_id)')
    .eq('user_id', userId)
    .eq('matches.kind', 'solo')
    .eq('matches.status', 'active')
    .limit(1)
    .maybeSingle();

  if (enrolledError) throw enrolledError;

  let match = enrolled?.matches as Tables<'matches'> | null;
  let points = enrolled?.points ?? 0;

  if (!match) {
    const { data: template, error: templateError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', DEMO_SOLO_MATCH_ID)
      .maybeSingle();

    if (templateError) throw templateError;
    if (!template) return null;

    points = await ensureSoloParticipant(userId, template.id);
    match = template;
  }

  const [{ data: profile, error: profileError }, { data: progress, error: progressError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('player_progress').select('total_xp').eq('user_id', userId).maybeSingle(),
    ]);

  if (profileError) throw profileError;
  if (progressError) throw progressError;
  if (!profile) return null;

  return mapSoloMatchRow(match, profile, progress, points);
}

export async function fetchActiveMatchId(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const teamId = await fetchUserTeamId(userId);
  if (teamId) {
    const { data, error } = await supabase
      .from('matches')
      .select('id')
      .eq('kind', 'team')
      .eq('status', 'active')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data?.id) return data.id;
  }

  const { data: soloParticipant, error: soloError } = await supabase
    .from('match_participants')
    .select('match_id, matches:match_id!inner (kind, status)')
    .eq('user_id', userId)
    .eq('matches.kind', 'solo')
    .eq('matches.status', 'active')
    .maybeSingle();

  if (soloError) throw soloError;
  return soloParticipant?.match_id ?? null;
}

export function fallbackTeamMatch(): ActiveTeamMatch {
  return MOCK_ACTIVE_TEAM_MATCH;
}

export function fallbackSoloMatch(): ActiveSoloMatch {
  return MOCK_ACTIVE_SOLO_MATCH;
}
