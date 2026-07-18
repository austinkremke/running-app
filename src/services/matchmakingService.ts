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

export async function forfeitSoloMatch(matchId: string): Promise<SoloMatchCompletion | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('forfeit_solo_match', {
    p_match_id: matchId,
  });

  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as Record<string, unknown>;
  if (payload.status !== 'completed') {
    return null;
  }

  return parseSoloMatchCompletion(payload.completion);
}

/** Durably marks a match's completion drawer as seen, so it never replays — including on a fresh install. */
export async function ackMatchCompletion(matchId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc('ack_match_completion', { p_match_id: matchId });

  if (error) {
    throw error;
  }
}

export async function fetchMySoloMatchCompletions(): Promise<SoloMatchCompletion[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_my_solo_match_completions', {
    p_limit: 20,
  });

  if (error) {
    throw error;
  }

  return parseSoloMatchCompletions(data);
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

function parseSoloMatchCompletions(payload: unknown): SoloMatchCompletion[] {
  return normalizeJsonArray(payload)
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
    myPoints: asNumber(row.my_points),
    opponentPoints: asNumber(row.opponent_points),
    opponentName: typeof row.opponent_name === 'string' ? row.opponent_name : 'Opponent',
    ratingDelta: asNumber(row.rating_delta),
    newRating: asNumber(row.new_rating),
    previousRating: asNumber(row.previous_rating),
    ...(row.season_wins != null ? { seasonWins: asNumber(row.season_wins) } : {}),
    ...(row.season_losses != null ? { seasonLosses: asNumber(row.season_losses) } : {}),
  };
}

function isSoloMatchOutcome(value: unknown): value is SoloMatchOutcome {
  return value === 'win' || value === 'loss' || value === 'tie';
}
