import type { UnlockedAchievementPayload } from '../achievementService';
import type { XpGainEvent } from '../../types/progression';
import { buildCombinedXpGainEvent } from './buildCombinedXpGainEvent';

export function buildPostRunXpGainEvent(options: {
  beforeTotalXp: number;
  runEvent: XpGainEvent;
  achievementUnlocks: UnlockedAchievementPayload[];
}): XpGainEvent {
  if (options.achievementUnlocks.length === 0) {
    return options.runEvent;
  }

  return buildCombinedXpGainEvent({
    beforeTotalXp: options.beforeTotalXp,
    runBreakdown: options.runEvent.breakdown,
    runSummary: options.runEvent.runSummary,
    achievementUnlocks: options.achievementUnlocks,
  });
}
