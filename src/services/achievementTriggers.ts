import type { UnlockedAchievementPayload } from './achievementService';
import { evaluateAchievements } from './achievementService';

export type AchievementUnlockPresentation = {
  beforeTotalXp: number;
  showUnlocks: (beforeTotalXp: number, unlocks: UnlockedAchievementPayload[]) => void;
};

export async function presentAchievementUnlocks(options: {
  beforeTotalXp: number;
  unlocks: UnlockedAchievementPayload[];
  showUnlocks: (beforeTotalXp: number, unlocks: UnlockedAchievementPayload[]) => void;
  refreshGameState?: () => Promise<void>;
}): Promise<UnlockedAchievementPayload[]> {
  if (options.unlocks.length === 0) {
    return options.unlocks;
  }

  options.showUnlocks(options.beforeTotalXp, options.unlocks);
  await options.refreshGameState?.();
  return options.unlocks;
}

export async function runAchievementEvaluation(options?: {
  refreshGameState?: () => Promise<void>;
  presentation?: AchievementUnlockPresentation;
}): Promise<UnlockedAchievementPayload[]> {
  try {
    const unlocks = await evaluateAchievements();
    if (unlocks.length > 0) {
      if (options?.presentation) {
        options.presentation.showUnlocks(options.presentation.beforeTotalXp, unlocks);
      }
      await options?.refreshGameState?.();
    }
    return unlocks;
  } catch (error) {
    console.warn('Achievement evaluation failed', error);
    return [];
  }
}
