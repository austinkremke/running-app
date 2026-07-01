import type { UnlockedAchievementPayload } from '../achievementService';
import type { AchievementUnlockSummary, XpGainEvent } from '../../types/progression';
import { buildXpGainEvent } from './buildXpGainEvent';

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function toAchievementSummary(unlock: UnlockedAchievementPayload): AchievementUnlockSummary {
  return {
    id: unlock.id,
    displayName: unlock.display_name,
    tier: unlock.tier,
    icon: unlock.icon,
    category: unlock.category,
  };
}

export function buildAchievementXpGainEvent(
  beforeTotalXp: number,
  unlocks: UnlockedAchievementPayload[],
): XpGainEvent {
  const xpEarned = unlocks.reduce((sum, unlock) => sum + unlock.xp_reward, 0);
  const achievementSummary = unlocks.map(toAchievementSummary);
  const breakdown = unlocks.map((unlock) => ({
    key: 'achievement' as const,
    label: unlock.display_name,
    detail: `${formatTier(unlock.tier)} · ${formatCategory(unlock.category)}`,
    xp: unlock.xp_reward,
  }));

  return buildXpGainEvent(
    beforeTotalXp,
    xpEarned,
    undefined,
    breakdown,
    'achievement',
    achievementSummary,
  );
}
