import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context';
import { fetchFriendIds, removeFriend } from '../services/friendService';
import { fetchPendingOutgoingFriendRequestIds, sendFriendRequest } from '../services/friendRequestService';

export function useFriends() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFriendIds([]);
      setPendingIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [ids, pending] = await Promise.all([
        fetchFriendIds(userId),
        fetchPendingOutgoingFriendRequestIds(userId),
      ]);
      setFriendIds(ids);
      setPendingIds(pending);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);
  const pendingIdSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const sendFriendRequestTo = useCallback(
    async (friendUserId: string) => {
      if (!userId || friendUserId === userId) {
        return;
      }

      const status = await sendFriendRequest(friendUserId);
      if (status === 'accepted' || status === 'already_friends') {
        setFriendIds((previous) =>
          previous.includes(friendUserId) ? previous : [...previous, friendUserId],
        );
        setPendingIds((previous) => previous.filter((id) => id !== friendUserId));
      } else {
        setPendingIds((previous) =>
          previous.includes(friendUserId) ? previous : [...previous, friendUserId],
        );
      }
    },
    [userId],
  );

  const removeFriendById = useCallback(
    async (friendUserId: string) => {
      if (!userId || friendUserId === userId) {
        return;
      }

      await removeFriend(friendUserId);
      setFriendIds((previous) => previous.filter((id) => id !== friendUserId));
    },
    [userId],
  );

  const isFriend = useCallback(
    (otherUserId: string) => friendIdSet.has(otherUserId),
    [friendIdSet],
  );

  const isPending = useCallback(
    (otherUserId: string) => pendingIdSet.has(otherUserId),
    [pendingIdSet],
  );

  return {
    friendIds,
    loading,
    refresh,
    sendFriendRequestTo,
    removeFriendById,
    isFriend,
    isPending,
  };
}
