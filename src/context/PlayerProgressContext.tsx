import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ProfileExperience, XpGainEvent } from '../mock';
import type { StoredActivity } from '../types/activity';
import { experienceFromTotalXp, levelFromTotalXp } from '../services/levelCurve';
import {
  awardRunXp,
  loadProgressionForUser,
  type AwardRunXpResult,
} from '../services/progression/progressionService';
import { useAuth } from './AuthContext';

type PlayerProgressContextValue = {
  totalXp: number;
  level: number;
  experience: ProfileExperience;
  loading: boolean;
  awardRunXp: (activity: StoredActivity) => Promise<AwardRunXpResult>;
  refreshProgress: () => Promise<void>;
};

const PlayerProgressContext = createContext<PlayerProgressContextValue | null>(null);

export function PlayerProgressProvider({ children }: { children: ReactNode }) {
  const { session, gameState, refreshGameState } = useAuth();
  const userId = session?.user?.id ?? null;
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    if (!userId) {
      setTotalXp(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const progression = await loadProgressionForUser(userId, gameState?.progress.total_xp ?? 0);
      setTotalXp(progression.totalXp);
      await refreshGameState();
    } finally {
      setLoading(false);
    }
  }, [gameState?.progress.total_xp, refreshGameState, userId]);

  useEffect(() => {
    void refreshProgress();
  }, [refreshProgress]);

  const awardRunXpForActivity = useCallback(
    async (activity: StoredActivity): Promise<AwardRunXpResult> => {
      if (!userId) {
        throw new Error('Sign in to earn XP.');
      }

      const result = await awardRunXp(userId, activity);
      setTotalXp(result.progression.totalXp);
      await refreshGameState();
      return result;
    },
    [refreshGameState, userId],
  );

  const level = useMemo(() => levelFromTotalXp(totalXp), [totalXp]);
  const experience = useMemo(() => experienceFromTotalXp(totalXp), [totalXp]);

  const value = useMemo(
    () => ({
      totalXp,
      level,
      experience,
      loading,
      awardRunXp: awardRunXpForActivity,
      refreshProgress,
    }),
    [awardRunXpForActivity, experience, level, loading, refreshProgress, totalXp],
  );

  return (
    <PlayerProgressContext.Provider value={value}>{children}</PlayerProgressContext.Provider>
  );
}

export function usePlayerProgress() {
  const context = useContext(PlayerProgressContext);
  if (!context) {
    throw new Error('usePlayerProgress must be used within PlayerProgressProvider');
  }
  return context;
}

export type { XpGainEvent };
