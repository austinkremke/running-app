import type { TeamMatchCompletion, TeamMatchOutcome } from '../types/teamMatchCompletion';
import { supabase } from './supabase';

export type TeamMatchmakingStatus =
  | { status: 'idle' }
  | { status: 'waiting'; queueId: string; enqueuedAt: string }
  | { status: 'matched'; matchId: string }
  | { status: 'in_match'; matchId: string };

function parseStatus(payload: Record<string, unknown>): TeamMatchmakingStatus {
  const status = payload.status;

  if (status === 'waiting' && typeof payload.queue_id === 'string') {
    return {
      status: 'waiting',
      queueId: payload.queue_id,
      enqueuedAt:
        typeof payload.enqueued_at === 'string' ? payload.enqueued_at : new Date().toISOString(),
    };
  }

  if ((status === 'matched' || status === 'in_match') && typeof payload.match_id === 'string') {
    return status === 'in_match'
      ? { status: 'in_match', matchId: payload.match_id }
      : { status: 'matched', matchId: payload.match_id };
  }

  return { status: 'idle' };
}

export async function getTeamMatchmakingStatus(): Promise<TeamMatchmakingStatus> {
  if (!supabase) {
    return { status: 'idle' };
  }

  const { data, error } = await supabase.rpc('get_team_matchmaking_status');
  if (error) {
    throw error;
  }

  return parseStatus((data ?? {}) as Record<string, unknown>);
}

export async function enqueueTeamMatchmaking(
  matchTypeId = 'team_3day',
): Promise<TeamMatchmakingStatus> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('enqueue_team_matchmaking', {
    p_match_type_id: matchTypeId,
  });

  if (error) {
    throw error;
  }

  return parseStatus((data ?? {}) as Record<string, unknown>);
}

export async function cancelTeamMatchmaking(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc('cancel_team_matchmaking');
  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as { cancelled?: boolean };
  return payload.cancelled === true;
}

function normalizeJsonArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function isTeamMatchOutcome(value: unknown): value is TeamMatchOutcome {
  return value === 'win' || value === 'loss' || value === 'tie';
}

function parseTeamMatchCompletion(payload: unknown): TeamMatchCompletion | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const row = payload as Record<string, unknown>;
  const matchId = row.match_id;
  const outcome = row.outcome;

  if (typeof matchId !== 'string' || !isTeamMatchOutcome(outcome)) {
    return null;
  }

  return {
    matchId,
    outcome,
    myPoints: asNumber(row.my_points),
    opponentPoints: asNumber(row.opponent_points),
    opponentTeamName: typeof row.opponent_team_name === 'string' ? row.opponent_team_name : 'Opponent',
    ratingDelta: asNumber(row.rating_delta),
    newRating: asNumber(row.new_rating),
    ...(row.season_wins != null ? { seasonWins: asNumber(row.season_wins) } : {}),
    ...(row.season_losses != null ? { seasonLosses: asNumber(row.season_losses) } : {}),
  };
}

function parseTeamMatchCompletions(payload: unknown): TeamMatchCompletion[] {
  return normalizeJsonArray(payload)
    .map((entry) => parseTeamMatchCompletion(entry))
    .filter((entry): entry is TeamMatchCompletion => entry !== null);
}

export async function finalizeDueTeamMatches(): Promise<TeamMatchCompletion[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('finalize_due_team_matches_for_user');
  if (error) {
    throw error;
  }

  return parseTeamMatchCompletions(data);
}

export async function fetchMyTeamMatchCompletions(): Promise<TeamMatchCompletion[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_my_team_match_completions', {
    p_limit: 20,
  });

  if (error) {
    throw error;
  }

  return parseTeamMatchCompletions(data);
}
