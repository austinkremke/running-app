import type { UnlockedAchievementPayload } from '../achievementService';
import type { XpGainEvent, XpGainRunSummary, XpGainSegment } from '../../types/progression';
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

export function buildCombinedXpGainEvent(options: {
  beforeTotalXp: number;
  runBreakdown: XpGainSegment[];
  runSummary?: XpGainRunSummary;
  achievementUnlocks: UnlockedAchievementPayload[];
}): XpGainEvent {
  const achievementSegments: XpGainSegment[] = options.achievementUnlocks.map((unlock) => ({
    key: 'achievement',
    label: unlock.display_name,
    detail: `${formatTier(unlock.tier)} · ${formatCategory(unlock.category)}`,
    xp: unlock.xp_reward,
  }));

  const runXp = options.runBreakdown.reduce((sum, segment) => sum + segment.xp, 0);
  const achievementXp = achievementSegments.reduce((sum, segment) => sum + segment.xp, 0);

  return buildXpGainEvent(
    options.beforeTotalXp,
    runXp + achievementXp,
    options.runSummary,
    [...options.runBreakdown, ...achievementSegments],
    'combined',
    options.achievementUnlocks.map((unlock) => ({
      id: unlock.id,
      displayName: unlock.display_name,
      tier: unlock.tier,
      icon: unlock.icon,
      category: unlock.category,
    })),
  );
}
