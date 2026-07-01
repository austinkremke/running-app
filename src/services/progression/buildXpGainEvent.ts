import type {
  AchievementUnlockSummary,
  XpGainEvent,
  XpGainRunSummary,
  XpGainSegment,
  XpGainSource,
} from '../../types/progression';
import { experienceFromTotalXp, levelFromTotalXp } from '../levelCurve';

export function buildXpGainEvent(
  beforeTotalXp: number,
  xpEarned: number,
  runSummary?: XpGainRunSummary,
  breakdown: XpGainSegment[] = [],
  source: XpGainSource = 'run',
  achievementSummary?: AchievementUnlockSummary[],
): XpGainEvent {
  const beforeExperience = experienceFromTotalXp(beforeTotalXp);

  return {
    source,
    xpEarned,
    startingLevel: levelFromTotalXp(beforeTotalXp),
    startingXp: beforeExperience.currentXp,
    xpToNextLevel: beforeExperience.nextLevelXp,
    runSummary,
    achievementSummary,
    breakdown,
  };
}
