import type { XpGainEvent, XpGainRunSummary, XpGainSegment } from '../../types/progression';
import { experienceFromTotalXp, levelFromTotalXp } from '../levelCurve';

export function buildXpGainEvent(
  beforeTotalXp: number,
  xpEarned: number,
  runSummary?: XpGainRunSummary,
  breakdown: XpGainSegment[] = [],
): XpGainEvent {
  const beforeExperience = experienceFromTotalXp(beforeTotalXp);

  return {
    xpEarned,
    startingLevel: levelFromTotalXp(beforeTotalXp),
    startingXp: beforeExperience.currentXp,
    xpToNextLevel: beforeExperience.nextLevelXp,
    runSummary,
    breakdown,
  };
}
