import type { TeamChatMessage } from '../mock';
import type { Tables } from '../types/database';
import { toContentFilterFriendlyError } from './contentFilterError';
import { supabase } from './supabase';

export type MatchMessageRow = Tables<'match_messages'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'avatar_url'> | null;
};

export function sanitizeMatchMessageBody(body: string): string {
  return body.trim().slice(0, 500);
}

function formatSentTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function mapMatchMessageRow(
  row: MatchMessageRow,
  currentUserId: string | null,
): TeamChatMessage {
  return {
    id: row.id,
    authorName: row.profiles?.display_name ?? 'Runner',
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    body: row.body,
    sentAt: formatSentTime(row.created_at),
    isCurrentUser: currentUserId != null && row.user_id === currentUserId,
  };
}

export async function fetchMatchMessages(matchId: string): Promise<MatchMessageRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('match_messages')
    .select(
      `
      id,
      match_id,
      user_id,
      body,
      created_at,
      profiles:user_id (display_name, avatar_url)
    `,
    )
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    throw error;
  }

  return (data ?? []) as MatchMessageRow[];
}

export async function sendMatchMessage(matchId: string, userId: string, body: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const sanitized = sanitizeMatchMessageBody(body);
  if (!sanitized) {
    return;
  }

  const { error } = await supabase.from('match_messages').insert({
    match_id: matchId,
    user_id: userId,
    body: sanitized,
  });

  if (error) {
    throw toContentFilterFriendlyError(error);
  }
}
