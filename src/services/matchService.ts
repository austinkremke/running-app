import type { ActiveSoloMatch, ActiveTeamMatch } from '../mock';
import { MOCK_ACTIVE_SOLO_MATCH } from '../mock/soloActiveMatch';
import { MOCK_ACTIVE_TEAM_MATCH } from '../mock/teamMatch';
import type { Tables } from '../types/database';
import { finalizeDueSoloMatches } from './matchmakingService';
import { mapSoloMatchRow, mapTeamMatchRow } from './matchMappers';
import { supabase } from './supabase';

export const DEMO_TEAM_MATCH_ID = '22222222-2222-4222-8222-222222222222';

type LiveMember = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
};

type ParticipantRow = Tables<'match_participants'> & {
  profiles: Tables<'profiles'> | null;
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

export async function fetchSoloMatchType(): Promise<Tables<'match_types'> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('match_types')
    .select('*')
    .eq('id', 'solo_distance')
    .maybeSingle();

  if (error) throw error;
  return data;
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

async function fetchParticipantBundle(
  matchId: string,
  userId: string,
): Promise<{
  match: Tables<'matches'>;
  self: ParticipantRow;
  opponent: ParticipantRow;
  activities: Tables<'activities'>[];
  matchType: Tables<'match_types'> | null;
} | null> {
  if (!supabase) return null;

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .eq('kind', 'solo')
    .eq('status', 'active')
    .maybeSingle();

  if (matchError) throw matchError;
  if (!match) return null;

  const { data: participants, error: participantsError } = await supabase
    .from('match_participants')
    .select('*, profiles:user_id (*)')
    .eq('match_id', matchId);

  if (participantsError) throw participantsError;

  const rows = (participants ?? []) as ParticipantRow[];
  const self = rows.find((row) => row.user_id === userId);
  const opponent = rows.find((row) => row.user_id && row.user_id !== userId);

  if (!self?.profiles || !opponent?.profiles || !opponent.user_id) {
    return null;
  }

  const [{ data: activities, error: activitiesError }, { data: matchType, error: matchTypeError }] =
    await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('match_id', matchId)
        .order('started_at', { ascending: false }),
      supabase.from('match_types').select('*').eq('id', match.match_type_id).maybeSingle(),
    ]);

  if (activitiesError) throw activitiesError;
  if (matchTypeError) throw matchTypeError;

  return {
    match,
    self: { ...self, profiles: self.profiles },
    opponent: { ...opponent, profiles: opponent.profiles },
    activities: activities ?? [],
    matchType: matchType ?? null,
    homeRating: 1000,
  };
}

export async function fetchActiveSoloMatch(userId: string): Promise<ActiveSoloMatch | null> {
  if (!supabase) return null;

  await finalizeDueSoloMatches();

  const { data: enrolled, error: enrolledError } = await supabase
    .from('match_participants')
    .select('match_id, points, side, matches:match_id!inner (id, kind, status)')
    .eq('user_id', userId)
    .eq('matches.kind', 'solo')
    .eq('matches.status', 'active')
    .limit(1)
    .maybeSingle();

  if (enrolledError) throw enrolledError;
  if (!enrolled?.match_id) return null;

  const bundle = await fetchParticipantBundle(enrolled.match_id, userId);
  if (!bundle) return null;

  const [{ data: selfProgress }, { data: opponentProgress }, { data: rankRow }] = await Promise.all([
    supabase!
      .from('player_progress')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase!
      .from('player_progress')
      .select('total_xp')
      .eq('user_id', bundle.opponent.user_id!)
      .maybeSingle(),
    supabase!
      .from('player_rank')
      .select('competitive_rating')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const homeIsSelf = bundle.self.side === 'home';
  const homeProfile = homeIsSelf ? bundle.self.profiles! : bundle.opponent.profiles!;
  const awayProfile = homeIsSelf ? bundle.opponent.profiles! : bundle.self.profiles!;
  const homePoints = homeIsSelf ? bundle.self.points : bundle.opponent.points;
  const awayPoints = homeIsSelf ? bundle.opponent.points : bundle.self.points;
  const homeProgress = homeIsSelf ? selfProgress : opponentProgress;
  const awayProgress = homeIsSelf ? opponentProgress : selfProgress;

  return mapSoloMatchRow(
    bundle.match,
    homeProfile,
    homeProgress,
    homePoints,
    awayProfile,
    awayProgress,
    awayPoints,
    bundle.activities,
    bundle.matchType,
    rankRow?.competitive_rating ?? 1000,
  );
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
