import { supabase } from './supabase';

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

export async function finalizeDueSoloMatches(): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc('finalize_due_solo_matches_for_user');
  if (error) {
    throw error;
  }
}
