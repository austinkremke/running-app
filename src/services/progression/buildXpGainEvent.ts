import type { XpGainEvent, XpGainRunSummary } from '../../mock';
import { experienceFromTotalXp, levelFromTotalXp } from '../levelCurve';

export function buildXpGainEvent(
  beforeTotalXp: number,
  xpEarned: number,
  runSummary?: XpGainRunSummary,
): XpGainEvent {
  const beforeExperience = experienceFromTotalXp(beforeTotalXp);

  return {
    xpEarned,
    startingLevel: levelFromTotalXp(beforeTotalXp),
    startingXp: beforeExperience.currentXp,
    xpToNextLevel: beforeExperience.nextLevelXp,
    runSummary,
  };
}
