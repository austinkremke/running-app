import { supabase } from './supabase';

export type ReportableContentType = 'feed_post' | 'feed_comment' | 'match_message' | 'profile';

export async function reportContent(
  contentType: ReportableContentType,
  contentId: string,
  reportedUserId?: string | null,
  reason?: string,
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('report_content', {
    p_content_type: contentType,
    p_content_id: contentId,
    p_reported_user_id: reportedUserId ?? undefined,
    p_reason: reason ?? undefined,
  });

  if (error) {
    throw error;
  }
}

export async function blockUser(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('block_user', { p_blocked_id: userId });
  if (error) {
    throw error;
  }
}

export async function unblockUser(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('unblock_user', { p_blocked_id: userId });
  if (error) {
    throw error;
  }
}

export async function fetchBlockedUserIds(): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('fetch_blocked_user_ids');
  if (error) {
    throw error;
  }

  return data ?? [];
}

export type BlockedUserProfile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};

export async function fetchBlockedUsers(): Promise<BlockedUserProfile[]> {
  const ids = await fetchBlockedUserIds();
  if (!supabase || ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
  }));
}
