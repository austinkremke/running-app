import { useCallback } from 'react';

import { useAuth, usePlayerProgress, useXpGain } from '../context';
import {
  evaluateAchievements,
  recordAchievementEvent,
  type AchievementEventType,
} from '../services/achievementService';
import {
  presentAchievementUnlocks,
  runAchievementEvaluation,
} from '../services/achievementTriggers';
import { buildPostRunXpGainEvent } from '../services/progression/buildPostRunXpGainEvent';
import type { AwardRunXpResult } from '../services/progression/progressionService';

export function useAchievementUnlockPresentation() {
  const { refreshGameState, gameState } = useAuth();
  const { totalXp } = usePlayerProgress();
  const { showAchievementUnlocks, showXpGain } = useXpGain();

  const getBeforeTotalXp = useCallback(
    () => gameState?.progress.total_xp ?? totalXp,
    [gameState?.progress.total_xp, totalXp],
  );

  const runEvaluation = useCallback(async () => {
    const beforeTotalXp = getBeforeTotalXp();
    return runAchievementEvaluation({
      refreshGameState,
      presentation: {
        beforeTotalXp,
        showUnlocks: showAchievementUnlocks,
      },
    });
  }, [getBeforeTotalXp, refreshGameState, showAchievementUnlocks]);

  const recordEvent = useCallback(
    async (eventType: AchievementEventType, metadata: Record<string, unknown> = {}) => {
      const beforeTotalXp = getBeforeTotalXp();
      const unlocks = await recordAchievementEvent(eventType, metadata);
      await presentAchievementUnlocks({
        beforeTotalXp,
        unlocks,
        showUnlocks: showAchievementUnlocks,
        refreshGameState,
      });
      return unlocks;
    },
    [getBeforeTotalXp, refreshGameState, showAchievementUnlocks],
  );

  const presentRunAward = useCallback(
    async (awardRun: () => Promise<AwardRunXpResult>) => {
      const beforeTotalXp = getBeforeTotalXp();
      const xpResult = await awardRun();
      let unlocks: Awaited<ReturnType<typeof evaluateAchievements>> = [];

      try {
        unlocks = await evaluateAchievements();
      } catch (error) {
        console.warn('Achievement evaluation failed', error);
      }

      const event = buildPostRunXpGainEvent({
        beforeTotalXp,
        runEvent: xpResult.event,
        achievementUnlocks: unlocks,
      });

      if (event.xpEarned > 0 || event.breakdown.length > 0) {
        showXpGain(event);
      }

      if (unlocks.length > 0) {
        await refreshGameState();
      }

      return { xpResult, unlocks };
    },
    [getBeforeTotalXp, refreshGameState, showXpGain],
  );

  return {
    getBeforeTotalXp,
    runEvaluation,
    recordEvent,
    presentRunAward,
    showAchievementUnlocks,
  };
}
