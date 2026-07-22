import { BASE_XP_PER_MILE } from '../config/xpRewards';
import { usePlayerProgress } from '../context';
import { cumulativeXpForLevel } from '../services/levelCurve';
import type { FeatureGateId } from '../services/featureGateService';
import { useFeatureGate } from './useFeatureGate';

export type LevelGateProgress = {
  ratio: number;
  estimatedRuns: number;
  minLevel: number;
};

/**
 * Makes the grind toward a level-gated feature concrete (progress bar +
 * rough "N more runs" estimate) — the gate level itself always comes from
 * the server-driven feature_gates catalog (useFeatureGate), never hardcoded
 * here. "Typical run" assumes a 3-mile run at the same base XP/mile rate
 * real runs earn, just for a rough estimate, not an exact prediction.
 */
export function useLevelGateProgress(featureId: FeatureGateId): LevelGateProgress | null {
  const gate = useFeatureGate(featureId);
  const { totalXp } = usePlayerProgress();

  if (!gate.locked || gate.minLevel == null) return null;

  const targetXp = cumulativeXpForLevel(gate.minLevel);
  return {
    ratio: targetXp > 0 ? totalXp / targetXp : 0,
    estimatedRuns: Math.max(1, Math.ceil(Math.max(0, targetXp - totalXp) / (BASE_XP_PER_MILE * 3))),
    minLevel: gate.minLevel,
  };
}
