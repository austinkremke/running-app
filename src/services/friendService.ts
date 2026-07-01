import { supabase } from './supabase';

export type FriendProfile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  teamName: string;
};

export async function fetchFriendIds(userId: string): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('friend_user_id')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.friend_user_id);
}

export async function addFriend(friendUserId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('add_friend', {
    p_friend_user_id: friendUserId,
  });

  if (error) {
    throw error;
  }
}

export async function isFriend(userId: string, otherUserId: string): Promise<boolean> {
  if (!supabase || userId === otherUserId) {
    return false;
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('friend_user_id')
    .eq('user_id', userId)
    .eq('friend_user_id', otherUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}
