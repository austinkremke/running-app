import { supabase } from './supabase';
import type { SoloMatchCompletion, SoloMatchOutcome } from '../types/soloMatchCompletion';

export type { SoloMatchCompletion } from '../types/soloMatchCompletion';

export type SoloMatchmakingStatus =
  | { status: 'idle' }
  | { status: 'waiting'; queueId: string; enqueuedAt: string }
  | { status: 'matched'; matchId: string }
  | { status: 'in_match'; matchId: string };

function parseStatus(payload: Record<string, unknown>): SoloMatchmakingStatus {
  const status = payload.status;

  if (status === 'waiting' && typeof payload.queue_id === 'string') {
    return {
      status: 'waiting',
      queueId: payload.queue_id,
      enqueuedAt: typeof payload.enqueued_at === 'string' ? payload.enqueued_at : new Date().toISOString(),
    };
  }

  if ((status === 'matched' || status === 'in_match') && typeof payload.match_id === 'string') {
    return status === 'in_match'
      ? { status: 'in_match', matchId: payload.match_id }
      : { status: 'matched', matchId: payload.match_id };
  }

  return { status: 'idle' };
}

export async function getSoloMatchmakingStatus(): Promise<SoloMatchmakingStatus> {
  if (!supabase) {
    return { status: 'idle' };
  }

  const { data, error } = await supabase.rpc('get_solo_matchmaking_status');
  if (error) {
    throw error;
  }

  return parseStatus((data ?? {}) as Record<string, unknown>);
}

export async function enqueueSoloMatchmaking(
  matchTypeId = 'solo_distance',
): Promise<SoloMatchmakingStatus> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('enqueue_solo_matchmaking', {
    p_match_type_id: matchTypeId,
  });

  if (error) {
    throw error;
  }

  return parseStatus((data ?? {}) as Record<string, unknown>);
}

export async function cancelSoloMatchmaking(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc('cancel_solo_matchmaking');
  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as { cancelled?: boolean };
  return payload.cancelled === true;
}

export async function creditMatchActivity(activityId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc('credit_match_activity', {
    p_activity_id: activityId,
  });

  if (error) {
    throw error;
  }
}

export async function finalizeDueSoloMatches(): Promise<SoloMatchCompletion[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('finalize_due_solo_matches_for_user');
  if (error) {
    throw error;
  }

  return parseSoloMatchCompletions(data);
}

function parseSoloMatchCompletions(payload: unknown): SoloMatchCompletion[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry) => parseSoloMatchCompletion(entry))
    .filter((entry): entry is SoloMatchCompletion => entry !== null);
}

function parseSoloMatchCompletion(payload: unknown): SoloMatchCompletion | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const row = payload as Record<string, unknown>;
  const matchId = row.match_id;
  const outcome = row.outcome;

  if (typeof matchId !== 'string' || !isSoloMatchOutcome(outcome)) {
    return null;
  }

  return {
    matchId,
    outcome,
    myPoints: typeof row.my_points === 'number' ? row.my_points : 0,
    opponentPoints: typeof row.opponent_points === 'number' ? row.opponent_points : 0,
    opponentName: typeof row.opponent_name === 'string' ? row.opponent_name : 'Opponent',
    ratingDelta: typeof row.rating_delta === 'number' ? row.rating_delta : 0,
    newRating: typeof row.new_rating === 'number' ? row.new_rating : 0,
    previousRating: typeof row.previous_rating === 'number' ? row.previous_rating : 0,
  };
}

function isSoloMatchOutcome(value: unknown): value is SoloMatchOutcome {
  return value === 'win' || value === 'loss' || value === 'tie';
}

export async function fetchStoredSoloMatchCompletions(userId: string): Promise<SoloMatchCompletion[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('match_participants')
    .select('match_id, matches:match_id!inner (id, kind, status, state_json, ends_at)')
    .eq('user_id', userId)
    .eq('matches.kind', 'solo')
    .eq('matches.status', 'completed')
    .order('ends_at', { ascending: false, referencedTable: 'matches' })
    .limit(5);

  if (error) {
    throw error;
  }

  const completions: SoloMatchCompletion[] = [];

  for (const row of data ?? []) {
    const match = row.matches as {
      state_json?: { completions?: Record<string, unknown> } | null;
    } | null;
    const stored = match?.state_json?.completions?.[userId];
    const parsed = parseSoloMatchCompletion(stored);
    if (parsed) {
      completions.push(parsed);
    }
  }

  return completions;
}
