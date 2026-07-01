import type { ImageSourcePropType } from 'react-native';

import { colors } from '../../theme';

export const RANK_BORDER_IMAGES = {
  bronze: require('../../../assets/borders/bronze-border.png'),
  silver: require('../../../assets/borders/silver-border.png'),
  gold: require('../../../assets/borders/gold-border.png'),
  elite: require('../../../assets/borders/elite-border.png'),
  legend: require('../../../assets/borders/legend-border.png'),
} as const;

export type RankBorderTierId = keyof typeof RANK_BORDER_IMAGES;

export const RANK_TIER_COLORS: Record<RankBorderTierId, string> = {
  bronze: '#CD8B5E',
  silver: '#B8C8DC',
  gold: colors.accentGold,
  elite: colors.accentPurple,
  legend: '#E8C04A',
};

/** Avatar diameter as a fraction of the outer frame size (tune against 400px ring art). */
export const RANK_BORDER_AVATAR_DIAMETER_RATIO = 0.74;

export function rankBorderSourceForTier(
  tierId: string | null | undefined,
): ImageSourcePropType | null {
  if (!tierId) {
    return null;
  }

  if (tierId in RANK_BORDER_IMAGES) {
    return RANK_BORDER_IMAGES[tierId as RankBorderTierId];
  }

  return null;
}

export function rankTierColorForTier(tierId: string | null | undefined): string {
  if (!tierId || !(tierId in RANK_TIER_COLORS)) {
    return colors.textSecondary;
  }

  return RANK_TIER_COLORS[tierId as RankBorderTierId];
}
