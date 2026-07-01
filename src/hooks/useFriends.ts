import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context';
import { addFriend, fetchFriendIds } from '../services/friendService';

export function useFriends() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFriendIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ids = await fetchFriendIds(userId);
      setFriendIds(ids);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);

  const addFriendById = useCallback(
    async (friendUserId: string) => {
      if (!userId || friendUserId === userId) {
        return;
      }

      await addFriend(friendUserId);
      setFriendIds((previous) =>
        previous.includes(friendUserId) ? previous : [...previous, friendUserId],
      );
    },
    [userId],
  );

  const isFriend = useCallback(
    (otherUserId: string) => friendIdSet.has(otherUserId),
    [friendIdSet],
  );

  return {
    friendIds,
    loading,
    refresh,
    addFriendById,
    isFriend,
  };
}
