import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../context';
import type { AchievementListItem } from '../services/achievementService';
import {
  evaluateAchievements,
  loadAchievementList,
  loadUnlockedAchievements,
  type UnlockedAchievementPayload,
} from '../services/achievementService';

export function useAchievements(options?: { evaluateOnMount?: boolean }) {
  const { session, refreshGameState } = useAuth();
  const userId = session?.user?.id ?? null;
  const [unlocked, setUnlocked] = useState<AchievementListItem[]>([]);
  const [allAchievements, setAllAchievements] = useState<AchievementListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setUnlocked([]);
      setAllAchievements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [nextUnlocked, nextAll] = await Promise.all([
        loadUnlockedAchievements(userId),
        loadAchievementList(userId),
      ]);
      setUnlocked(nextUnlocked);
      setAllAchievements(nextAll);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const evaluateAndReload = useCallback(async (): Promise<UnlockedAchievementPayload[]> => {
    if (!userId) {
      return [];
    }

    try {
      const newlyUnlocked = await evaluateAchievements();
      if (newlyUnlocked.length > 0) {
        await refreshGameState();
      }
      await reload();
      return newlyUnlocked;
    } catch (error) {
      console.warn('Achievement evaluation failed', error);
      await reload();
      return [];
    }
  }, [reload, refreshGameState, userId]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!userId) {
        setUnlocked([]);
        setAllAchievements([]);
        setLoading(false);
        return;
      }

      if (options?.evaluateOnMount) {
        await evaluateAndReload();
        return;
      }

      if (!cancelled) {
        await reload();
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [evaluateAndReload, options?.evaluateOnMount, reload, userId]);

  return {
    unlocked,
    allAchievements,
    loading,
    reload,
    evaluateAndReload,
  };
}
