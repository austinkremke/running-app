import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context';
import { fetchFollowingIds, followUser, unfollowUser } from '../services/followService';

/**
 * Following is instant and one-directional — no request/approval step, so
 * unlike the old friend system there's no "pending" state to track.
 */
export function useFollows() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFollowingIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ids = await fetchFollowingIds(userId);
      setFollowingIds(ids);
    } catch (error) {
      console.warn('Failed to load following list', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const followingIdSet = useMemo(() => new Set(followingIds), [followingIds]);

  const follow = useCallback(
    async (followedUserId: string) => {
      if (!userId) {
        throw new Error('You need to be signed in to follow someone.');
      }
      if (followedUserId === userId) {
        return;
      }

      await followUser(followedUserId);
      setFollowingIds((previous) =>
        previous.includes(followedUserId) ? previous : [...previous, followedUserId],
      );
    },
    [userId],
  );

  const unfollow = useCallback(
    async (followedUserId: string) => {
      if (!userId || followedUserId === userId) {
        return;
      }

      await unfollowUser(followedUserId);
      setFollowingIds((previous) => previous.filter((id) => id !== followedUserId));
    },
    [userId],
  );

  const isFollowing = useCallback(
    (otherUserId: string) => followingIdSet.has(otherUserId),
    [followingIdSet],
  );

  return {
    followingIds,
    loading,
    refresh,
    follow,
    unfollow,
    isFollowing,
  };
}
