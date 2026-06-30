import type { RankTierRow } from '../../types/rank';
import type { ResolvedRankTier } from '../../types/rank';

export function mapRankTierRow(row: RankTierRow): ResolvedRankTier {
  return {
    id: row.id,
    displayName: row.display_name,
    subtitle: row.subtitle ?? '',
    icon: row.icon,
    minRating: row.min_rating,
  };
}

export function tierFromRating(
  rating: number,
  tiers: ResolvedRankTier[],
): ResolvedRankTier {
  if (tiers.length === 0) {
    return {
      id: 'unranked',
      displayName: 'Unranked',
      subtitle: '',
      icon: 'shield-outline',
      minRating: 0,
    };
  }

  const sorted = [...tiers].sort((a, b) => b.minRating - a.minRating);
  const match = sorted.find((tier) => rating >= tier.minRating);

  return match ?? sorted[sorted.length - 1]!;
}
