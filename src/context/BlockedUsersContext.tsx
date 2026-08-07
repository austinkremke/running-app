import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { blockUser, fetchBlockedUserIds, unblockUser } from '../services/moderationService';
import { useAuth } from './AuthContext';

type BlockedUsersContextValue = {
  blockedIds: Set<string>;
  isBlocked: (userId: string) => boolean;
  /** Blocks the user server-side and updates the local set immediately —
   *  callers doing feed/list filtering should also react to `blockedIds`
   *  changing so removal is instant rather than waiting on a refetch. */
  block: (userId: string) => Promise<void>;
  unblock: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const BlockedUsersContext = createContext<BlockedUsersContextValue | null>(null);

export function BlockedUsersProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!userId) {
      setBlockedIds(new Set());
      return;
    }

    try {
      const ids = await fetchBlockedUserIds();
      setBlockedIds(new Set(ids));
    } catch (error) {
      console.warn('Failed to load blocked users', error);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const block = useCallback(async (targetUserId: string) => {
    setBlockedIds((previous) => new Set(previous).add(targetUserId));
    try {
      await blockUser(targetUserId);
    } catch (error) {
      setBlockedIds((previous) => {
        const next = new Set(previous);
        next.delete(targetUserId);
        return next;
      });
      throw error;
    }
  }, []);

  const unblock = useCallback(async (targetUserId: string) => {
    setBlockedIds((previous) => {
      const next = new Set(previous);
      next.delete(targetUserId);
      return next;
    });
    try {
      await unblockUser(targetUserId);
    } catch (error) {
      setBlockedIds((previous) => new Set(previous).add(targetUserId));
      throw error;
    }
  }, []);

  const isBlocked = useCallback((targetUserId: string) => blockedIds.has(targetUserId), [blockedIds]);

  const value = useMemo(
    () => ({ blockedIds, isBlocked, block, unblock, refresh }),
    [blockedIds, isBlocked, block, unblock, refresh],
  );

  return <BlockedUsersContext.Provider value={value}>{children}</BlockedUsersContext.Provider>;
}

export function useBlockedUsers() {
  const context = useContext(BlockedUsersContext);
  if (!context) {
    throw new Error('useBlockedUsers must be used within BlockedUsersProvider');
  }
  return context;
}
