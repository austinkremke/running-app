import { Alert } from 'react-native';

import type { UnlockedAchievementPayload } from '../services/achievementService';
import { evaluateAchievements } from '../services/achievementService';

export function notifyAchievementUnlocks(unlocks: UnlockedAchievementPayload[]): void {
  if (unlocks.length === 0) {
    return;
  }

  const [first, ...rest] = unlocks;
  const xpSuffix = first.xp_reward > 0 ? ` (+${first.xp_reward} XP)` : '';
  const extra = rest.length > 0 ? `\n\n+${rest.length} more achievement${rest.length === 1 ? '' : 's'}.` : '';

  Alert.alert('Achievement unlocked', `${first.display_name}${xpSuffix}${extra}`);
}

export async function runAchievementEvaluation(options?: {
  onUnlock?: (unlocks: UnlockedAchievementPayload[]) => void;
  refreshGameState?: () => Promise<void>;
}): Promise<UnlockedAchievementPayload[]> {
  try {
    const unlocks = await evaluateAchievements();
    if (unlocks.length > 0) {
      await options?.refreshGameState?.();
      options?.onUnlock?.(unlocks);
      notifyAchievementUnlocks(unlocks);
    }
    return unlocks;
  } catch (error) {
    console.warn('Achievement evaluation failed', error);
    return [];
  }
}
