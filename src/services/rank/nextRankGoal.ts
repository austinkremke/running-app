import type { ProfileNextRankGoal } from '../../mock';
import type { RankTierRow, ResolvedRankTier } from '../../types/rank';
import { mapRankTierRow, tierFromRating } from './tierFromRating';

export function buildNextRankGoal(
  rating: number,
  tiers: ResolvedRankTier[],
): ProfileNextRankGoal | null {
  if (tiers.length === 0) {
    return null;
  }

  const sorted = [...tiers].sort((a, b) => a.minRating - b.minRating);
  const current = tierFromRating(rating, sorted);
  const currentIndex = sorted.findIndex((tier) => tier.id === current.id);
  const next = currentIndex >= 0 ? sorted[currentIndex + 1] : undefined;

  if (!next) {
    return null;
  }

  const span = next.minRating - current.minRating;
  const progress = span > 0 ? (rating - current.minRating) / span : 1;
  const pointsNeeded = Math.max(0, next.minRating - rating);

  return {
    nextTierId: next.id,
    nextTierTitle: next.displayName.toUpperCase(),
    pointsNeeded,
    progress: Math.min(Math.max(progress, 0), 1),
    currentRating: rating,
    nextTierMinRating: next.minRating,
    currentTierMinRating: current.minRating,
  };
}

export function buildNextRankGoalFromRows(
  rating: number,
  tiers: RankTierRow[],
): ProfileNextRankGoal | null {
  return buildNextRankGoal(rating, tiers.map(mapRankTierRow));
}
