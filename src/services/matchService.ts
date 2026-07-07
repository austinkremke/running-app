import type {
  ActiveSoloMatch,
  ActiveTeamMatch,
  Run,
  TeamLogoAccent,
  TeamMatchActivity,
  TeamMatchHistoryEntry,
  TeamMatchHistorySide,
} from '../mock';
import { MOCK_ACTIVE_SOLO_MATCH } from '../mock/soloActiveMatch';
import type { Tables } from '../types/database';
import { mapSoloMatchRow, mapTeamMatchRow, isMatchTimerExpired } from './matchMappers';
import { matchPointsForActivity } from './match/matchScoring';
import { finalizeDueSoloMatches } from './matchmakingService';
import { notifySoloMatchCompletionSync } from './soloMatchCompletionBus';
import { fetchRankTiers } from './rank';
import { mapRankTierRow, tierFromRating } from './rank/tierFromRating';
import { formatDurationParts, formatPace, metersToMiles } from './distanceService';
import { levelFromTotalXp } from './levelCurve';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { supabase } from './supabase';

export const DEMO_TEAM_MATCH_ID = '22222222-2222-4222-8222-222222222222';

type LiveMember = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  points?: number;
  distanceMiles?: number;
  pacePerMile?: string;
};

function formatPaceLabel(paceSecPerMile: number): string {
  if (!Number.isFinite(paceSecPerMile) || paceSecPerMile <= 0) return '--';
  return formatPace(paceSecPerMile);
}

function formatTimeAgoLabel(startedAt: string): string {
  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function fetchTeamMatchActivities(
  userIds: string[],
  windowStart: string,
  windowEnd: string,
): Promise<Tables<'activities'>[]> {
  if (!supabase || userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .in('user_id', userIds)
    .gte('started_at', windowStart)
    .lte('started_at', windowEnd)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

function aggregateMemberActivityStats(
  activities: Tables<'activities'>[],
  userId: string,
): { points: number; distanceMiles: number; pacePerMile: string } {
  const userActivities = activities.filter((activity) => activity.user_id === userId);
  const distanceMeters = userActivities.reduce(
    (sum, activity) => sum + (activity.distance_meters ?? 0),
    0,
  );
  const durationSeconds = userActivities.reduce(
    (sum, activity) => sum + (activity.duration_seconds ?? 0),
    0,
  );
  const points = userActivities.reduce(
    (sum, activity) =>
      sum + matchPointsForActivity(activity.distance_meters ?? 0, activity.duration_seconds),
    0,
  );
  const distanceMiles = distanceMeters / 1609.34;
  const pacePerMile = formatPaceLabel(distanceMiles > 0 ? durationSeconds / distanceMiles : 0);

  return { points, distanceMiles, pacePerMile };
}

function withActivityStats(members: LiveMember[], activities: Tables<'activities'>[]): LiveMember[] {
  return members.map((member) => ({
    ...member,
    ...aggregateMemberActivityStats(activities, member.user_id),
  }));
}

function buildRunFromTeamMatchActivity(
  activity: Tables<'activities'>,
  member: LiveMember | undefined,
  teamName: string,
): Run {
  const distanceMiles = metersToMiles(activity.distance_meters ?? 0);
  const paceSecPerMile = distanceMiles > 0 ? (activity.duration_seconds ?? 0) / distanceMiles : 0;
  const duration = formatDurationParts(activity.duration_seconds ?? 0);

  return {
    id: activity.id,
    user: {
      id: member?.user_id ?? activity.user_id,
      name: member?.display_name ?? 'Runner',
      avatarUrl: member?.avatar_url ?? undefined,
      level: levelFromTotalXp(member?.total_xp ?? 0),
      teamName,
    },
    title: 'Completed a run',
    description: '',
    location: '',
    postedAt: formatRelativeTime(activity.started_at),
    stats: {
      distanceMiles: Number(distanceMiles.toFixed(2)),
      pacePerMile: formatPace(paceSecPerMile),
      duration: duration.value,
      durationUnit: duration.unit,
    },
    routePoints: [],
    likes: 0,
    comments: 0,
    likedByMe: false,
    feedTabs: [],
    matchId: activity.match_id ?? undefined,
  };
}

function buildTeamMatchActivityFeed(
  activities: Tables<'activities'>[],
  homeMembers: LiveMember[],
  awayMembers: LiveMember[],
  homeTeamName: string,
  awayTeamName: string,
): TeamMatchActivity[] {
  const homeIds = new Set(homeMembers.map((member) => member.user_id));
  const byId = new Map([...homeMembers, ...awayMembers].map((member) => [member.user_id, member]));

  return activities.map((activity) => {
    const member = byId.get(activity.user_id);
    const isHome = homeIds.has(activity.user_id);
    const distanceMiles = (activity.distance_meters ?? 0) / 1609.34;
    const paceSecPerMile =
      distanceMiles > 0 ? (activity.duration_seconds ?? 0) / distanceMiles : 0;

    return {
      id: activity.id,
      avatarUrl: member?.avatar_url ?? undefined,
      playerName: member?.display_name ?? 'Runner',
      description: `ran ${distanceMiles.toFixed(1)} miles at ${formatPaceLabel(paceSecPerMile)} min/mi`,
      pointsEarned: matchPointsForActivity(activity.distance_meters ?? 0, activity.duration_seconds),
      timeAgo: formatTimeAgoLabel(activity.started_at),
      accent: isHome ? 'lime' : 'purple',
      run: buildRunFromTeamMatchActivity(activity, member, isHome ? homeTeamName : awayTeamName),
    };
  });
}

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

export async function fetchTeamMatchType(): Promise<Tables<'match_types'> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('match_types')
    .select('*')
    .eq('id', 'team_3day')
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
    .gt('ends_at', new Date().toISOString())
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

  const [liveHomeMembers, liveAwayMembers, { data: homeRank }, { data: awayRank }, tiers] =
    await Promise.all([
      fetchLiveTeamMembers(match.home_team_id),
      fetchLiveTeamMembers(match.away_team_id),
      supabase.from('team_rank').select('competitive_rating').eq('team_id', match.home_team_id).maybeSingle(),
      supabase.from('team_rank').select('competitive_rating').eq('team_id', match.away_team_id).maybeSingle(),
      fetchRankTiers(),
    ]);

  const resolvedTiers = tiers.map(mapRankTierRow);
  const homeRankTierId =
    homeRank?.competitive_rating != null && resolvedTiers.length > 0
      ? tierFromRating(homeRank.competitive_rating, resolvedTiers).id
      : undefined;
  const awayRankTierId =
    awayRank?.competitive_rating != null && resolvedTiers.length > 0
      ? tierFromRating(awayRank.competitive_rating, resolvedTiers).id
      : undefined;

  const allMemberIds = [...liveHomeMembers, ...liveAwayMembers].map((member) => member.user_id);
  const matchActivities = await fetchTeamMatchActivities(
    allMemberIds,
    match.created_at,
    match.ends_at,
  );

  const liveHomeMembersWithStats = withActivityStats(liveHomeMembers, matchActivities);
  const liveAwayMembersWithStats = withActivityStats(liveAwayMembers, matchActivities);
  const activityFeed = buildTeamMatchActivityFeed(
    matchActivities,
    liveHomeMembersWithStats,
    liveAwayMembersWithStats,
    homeTeam.name,
    awayTeam.name,
  );

  return mapTeamMatchRow(
    match,
    homeTeam,
    awayTeam,
    liveHomeMembersWithStats,
    liveAwayMembersWithStats,
    homeRankTierId,
    awayRankTierId,
    activityFeed,
  );
}

const HISTORY_LOGO_ACCENTS = new Set<TeamLogoAccent>([
  'lime',
  'purple',
  'gold',
  'silver',
  'cyan',
  'blue',
]);

function asHistoryLogoAccent(value: string | null | undefined): TeamLogoAccent {
  return HISTORY_LOGO_ACCENTS.has(value as TeamLogoAccent) ? (value as TeamLogoAccent) : 'lime';
}

function toHistorySide(team: Tables<'teams'>): TeamMatchHistorySide {
  return {
    id: team.id,
    name: team.name,
    accent: asHistoryLogoAccent(team.logo_accent),
    shieldIcon: team.logo_icon,
  };
}

export async function fetchTeamMatchHistory(
  teamId: string,
  limit = 10,
): Promise<TeamMatchHistoryEntry[]> {
  if (!supabase) return [];

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('kind', 'team')
    .eq('status', 'completed')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('ends_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!matches || matches.length === 0) return [];

  const teamIds = [
    ...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id])),
  ].filter((id): id is string => id != null);

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds);

  if (teamsError) throw teamsError;

  const teamsById = new Map((teams ?? []).map((team) => [team.id, team]));

  return matches
    .map((match): TeamMatchHistoryEntry | null => {
      const homeTeam = match.home_team_id ? teamsById.get(match.home_team_id) : null;
      const awayTeam = match.away_team_id ? teamsById.get(match.away_team_id) : null;
      if (!homeTeam || !awayTeam) return null;

      const state = (match.state_json ?? {}) as {
        home_points?: number;
        away_points?: number;
        result?: 'home' | 'away' | 'tie';
      };
      const homePoints = state.home_points ?? 0;
      const awayPoints = state.away_points ?? 0;
      const isHomeViewer = homeTeam.id === teamId;
      const viewerWon = isHomeViewer ? state.result === 'home' : state.result === 'away';
      const outcome: TeamMatchHistoryEntry['outcome'] =
        state.result === 'tie' ? 'tie' : viewerWon ? 'win' : 'loss';

      return {
        id: match.id,
        endsAt: match.ends_at,
        homeTeam: toHistorySide(homeTeam),
        awayTeam: toHistorySide(awayTeam),
        homePoints,
        awayPoints,
        outcome,
      };
    })
    .filter((entry): entry is TeamMatchHistoryEntry => entry !== null);
}

type SoloMatchEnrollment = {
  match_id: string;
  matches: {
    id: string;
    kind: string;
    status: string;
    ends_at: string;
  } | null;
};

async function fetchActiveSoloMatchEnrollment(userId: string): Promise<SoloMatchEnrollment | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('match_participants')
    .select('match_id, matches:match_id!inner (id, kind, status, ends_at)')
    .eq('user_id', userId)
    .eq('matches.kind', 'solo')
    .eq('matches.status', 'active')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SoloMatchEnrollment | null) ?? null;
}

async function resolveActiveSoloMatchId(userId: string): Promise<string | null> {
  let enrolled = await fetchActiveSoloMatchEnrollment(userId);
  if (!enrolled?.match_id) {
    return null;
  }

  const endsAt = enrolled.matches?.ends_at;
  if (!isMatchTimerExpired(endsAt)) {
    return enrolled.match_id;
  }

  const finalized = await finalizeDueSoloMatches();
  if (finalized.length > 0) {
    notifySoloMatchCompletionSync(finalized);
  }

  enrolled = await fetchActiveSoloMatchEnrollment(userId);
  if (!enrolled?.match_id) {
    return null;
  }

  if (isMatchTimerExpired(enrolled.matches?.ends_at)) {
    return null;
  }

  return enrolled.match_id;
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
  };
}

export async function fetchActiveSoloMatch(
  userId: string,
  _options?: { skipFinalize?: boolean },
): Promise<ActiveSoloMatch | null> {
  if (!supabase) return null;

  const matchId = await resolveActiveSoloMatchId(userId);
  if (!matchId) return null;

  const bundle = await fetchParticipantBundle(matchId, userId);
  if (!bundle) return null;

  const [{ data: selfProgress }, { data: opponentProgress }, { data: selfRank }, { data: opponentRank }, tiers] =
    await Promise.all([
      supabase!
        .from('player_progress')
        .select('total_xp, streak_days')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase!
        .from('player_progress')
        .select('total_xp, streak_days')
        .eq('user_id', bundle.opponent.user_id!)
        .maybeSingle(),
      supabase!
        .from('player_rank')
        .select('competitive_rating')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase!
        .from('player_rank')
        .select('competitive_rating')
        .eq('user_id', bundle.opponent.user_id!)
        .maybeSingle(),
      fetchRankTiers(),
    ]);

  const resolvedTiers = tiers.map(mapRankTierRow);
  const selfRankTierId =
    selfRank?.competitive_rating != null && resolvedTiers.length > 0
      ? tierFromRating(selfRank.competitive_rating, resolvedTiers).id
      : undefined;
  const opponentRankTierId =
    opponentRank?.competitive_rating != null && resolvedTiers.length > 0
      ? tierFromRating(opponentRank.competitive_rating, resolvedTiers).id
      : undefined;

  return mapSoloMatchRow(
    bundle.match,
    bundle.self.profiles!,
    selfProgress,
    bundle.self.points,
    bundle.opponent.profiles!,
    opponentProgress,
    bundle.opponent.points,
    bundle.activities,
    bundle.matchType,
    selfRank?.competitive_rating ?? 1000,
    selfRankTierId,
    opponentRankTierId,
  );
}

export async function fetchActiveSoloMatchId(
  userId: string,
  options?: { skipFinalize?: boolean },
): Promise<string | null> {
  if (options?.skipFinalize) {
    return fetchLiveActiveSoloMatchId(userId);
  }

  return resolveActiveSoloMatchId(userId);
}

export async function fetchActiveTeamMatchId(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const teamId = await fetchUserTeamId(userId);
  if (!teamId) return null;

  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .eq('kind', 'team')
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString())
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function fetchLiveActiveSoloMatchId(userId: string): Promise<string | null> {
  const enrolled = await fetchActiveSoloMatchEnrollment(userId);
  if (!enrolled?.match_id || isMatchTimerExpired(enrolled.matches?.ends_at)) {
    return null;
  }

  return enrolled.match_id;
}

export async function fetchHasActiveMatch(userId: string): Promise<boolean> {
  const [soloMatchId, teamMatchId] = await Promise.all([
    fetchLiveActiveSoloMatchId(userId),
    fetchActiveTeamMatchId(userId),
  ]);

  return soloMatchId != null || teamMatchId != null;
}

export async function fetchActiveMatchId(userId: string): Promise<string | null> {
  const soloMatchId = await fetchActiveSoloMatchId(userId);
  if (soloMatchId) {
    return soloMatchId;
  }

  return fetchActiveTeamMatchId(userId);
}

type SoloMatchOutcome = 'win' | 'loss' | 'tie';

function outcomeFromPoints(myPoints: number, opponentPoints: number): SoloMatchOutcome {
  if (myPoints > opponentPoints) {
    return 'win';
  }

  if (myPoints < opponentPoints) {
    return 'loss';
  }

  return 'tie';
}

function computeBestWinStreak(outcomes: SoloMatchOutcome[]): number {
  let best = 0;
  let run = 0;

  for (const outcome of outcomes) {
    if (outcome === 'win') {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  return best;
}

export async function fetchSoloBestWinStreak(userId: string): Promise<number> {
  if (!supabase) {
    return 0;
  }

  const { data, error } = await supabase
    .from('match_participants')
    .select('match_id, points, matches:match_id!inner (ends_at, kind, status)')
    .eq('user_id', userId)
    .eq('matches.kind', 'solo')
    .eq('matches.status', 'completed');

  if (error) {
    throw error;
  }

  const rows = [...(data ?? [])].sort((left, right) => {
    const leftEndsAt = (left.matches as { ends_at?: string } | null)?.ends_at ?? '';
    const rightEndsAt = (right.matches as { ends_at?: string } | null)?.ends_at ?? '';
    return leftEndsAt.localeCompare(rightEndsAt);
  });

  if (rows.length === 0) {
    return 0;
  }

  const matchIds = rows.map((row) => row.match_id);
  const { data: participants, error: participantsError } = await supabase
    .from('match_participants')
    .select('match_id, user_id, points')
    .in('match_id', matchIds);

  if (participantsError) {
    throw participantsError;
  }

  const outcomes = rows.map((row) => {
    const opponent = (participants ?? []).find(
      (participant) => participant.match_id === row.match_id && participant.user_id !== userId,
    );
    return outcomeFromPoints(row.points ?? 0, opponent?.points ?? 0);
  });

  return computeBestWinStreak(outcomes);
}

export function fallbackSoloMatch(): ActiveSoloMatch {
  return MOCK_ACTIVE_SOLO_MATCH;
}
