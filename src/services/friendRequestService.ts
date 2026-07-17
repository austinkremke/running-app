import { supabase } from './supabase';

export type FriendRequestNotification = {
  id: string;
  kind: 'friend_request';
  actorId: string;
  actorName: string;
  actorAvatarUrl?: string;
  actorLevel: number;
  createdAt: string;
};

function parseFriendRequestNotification(payload: unknown): FriendRequestNotification | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const row = payload as Record<string, unknown>;
  const id = row.id;

  if (typeof id !== 'string') {
    return null;
  }

  return {
    id,
    kind: 'friend_request',
    actorId: typeof row.actor_id === 'string' ? row.actor_id : '',
    actorName: typeof row.actor_name === 'string' ? row.actor_name : 'Runner',
    actorAvatarUrl: typeof row.actor_avatar_url === 'string' ? row.actor_avatar_url : undefined,
    actorLevel: typeof row.actor_level === 'number' ? row.actor_level : 0,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

export type SendFriendRequestStatus = 'requested' | 'already_pending' | 'already_friends' | 'accepted';

export async function sendFriendRequest(toUserId: string): Promise<SendFriendRequestStatus> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('send_friend_request', { p_to_user_id: toUserId });
  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as { status?: SendFriendRequestStatus };
  return payload.status ?? 'requested';
}

export async function respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('respond_to_friend_request', {
    p_request_id: requestId,
    p_accept: accept,
  });
  if (error) {
    throw error;
  }
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('cancel_friend_request', { p_request_id: requestId });
  if (error) {
    throw error;
  }
}

export async function fetchFriendRequestNotifications(): Promise<FriendRequestNotification[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_friend_notifications');
  if (error) {
    throw error;
  }

  const list = Array.isArray(data) ? data : [];
  return list
    .map((entry) => parseFriendRequestNotification(entry))
    .filter((entry): entry is FriendRequestNotification => entry !== null);
}

export async function hasFriendRequestNotifications(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc('has_friend_notifications');
  if (error) {
    throw error;
  }

  return data === true;
}

/** Pending outgoing friend requests from this user — used to show "Pending" on the Add Friend button. */
export async function fetchPendingOutgoingFriendRequestIds(userId: string): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select('to_user_id')
    .eq('from_user_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.to_user_id);
}
