import { metersToMiles } from './distanceService';
import { supabase } from './supabase';

export type CompetitiveStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  avgDistancePerMatchMiles: number;
};

const EMPTY_STATS: CompetitiveStats = {
  totalMatches: 0,
  wins: 0,
  losses: 0,
  avgDistancePerMatchMiles: 0,
};

/**
 * Win/loss record plus average distance per completed match. The record
 * comes from the same server-authoritative season totals used elsewhere
 * (player_rank for solo, team_rank for the runner's team) rather than being
 * re-derived from match_participants.points — that column is a binary 0/1
 * win flag per side, not a real point total, and is left unpopulated (0-0)
 * for forfeited/unscored matches, which would misread as ties.
 */
export async function fetchCompetitiveStats(userId: string): Promise<CompetitiveStats> {
  if (!supabase) return EMPTY_STATS;

  const { data: rank, error: rankError } = await supabase
    .from('player_rank')
    .select('season_wins, season_losses')
    .eq('user_id', userId)
    .maybeSingle();
  if (rankError) throw rankError;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) throw profileError;

  let teamWins = 0;
  let teamLosses = 0;
  if (profile?.team_id) {
    const { data: teamRank, error: teamRankError } = await supabase
      .from('team_rank')
      .select('season_wins, season_losses')
      .eq('team_id', profile.team_id)
      .maybeSingle();
    if (teamRankError) throw teamRankError;
    teamWins = teamRank?.season_wins ?? 0;
    teamLosses = teamRank?.season_losses ?? 0;
  }

  const wins = (rank?.season_wins ?? 0) + teamWins;
  const losses = (rank?.season_losses ?? 0) + teamLosses;

  const { data: ownRows, error: ownError } = await supabase
    .from('match_participants')
    .select('match_id, matches:match_id!inner (status)')
    .eq('user_id', userId)
    .eq('matches.status', 'completed');
  if (ownError) throw ownError;

  const matchIds = (ownRows ?? []).map((row) => row.match_id);
  let avgDistancePerMatchMiles = 0;

  if (matchIds.length > 0) {
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('match_id, distance_meters')
      .eq('user_id', userId)
      .in('match_id', matchIds);
    if (activitiesError) throw activitiesError;

    const distanceByMatch = new Map<string, number>();
    for (const activity of activities ?? []) {
      if (!activity.match_id) continue;
      distanceByMatch.set(activity.match_id, (distanceByMatch.get(activity.match_id) ?? 0) + (activity.distance_meters ?? 0));
    }

    const distances = [...distanceByMatch.values()].map(metersToMiles);
    avgDistancePerMatchMiles = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0;
  }

  return {
    totalMatches: matchIds.length,
    wins,
    losses,
    avgDistancePerMatchMiles,
  };
}
