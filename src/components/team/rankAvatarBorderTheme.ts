import type { ImageSourcePropType } from 'react-native';

import { colors } from '../../theme';
import type { RankBorderTierId } from './rankBorderLayout';
import {
  RANK_BORDER_AVATAR_DIAMETER_RATIO,
  rankBorderAssetMeta,
  rankBorderAvatarLayout,
} from './rankBorderLayout';

export const RANK_BORDER_IMAGES = {
  bronze: require('../../../assets/borders/bronze-border.png'),
  silver: require('../../../assets/borders/silver-border.png'),
  gold: require('../../../assets/borders/gold-border.png'),
  elite: require('../../../assets/borders/elite-border.png'),
  legend: require('../../../assets/borders/legend-border.png'),
} as const;

export type { RankBorderAssetMeta, RankBorderAvatarLayout, RankBorderTierId } from './rankBorderLayout';
export {
  RANK_BORDER_ASSET_META,
  RANK_BORDER_AVATAR_DIAMETER_RATIO,
  rankBorderAssetMeta,
  rankBorderAvatarLayout,
} from './rankBorderLayout';

export const RANK_TIER_COLORS: Record<RankBorderTierId, string> = {
  bronze: '#CD8B5E',
  silver: '#B8C8DC',
  gold: colors.accentGold,
  elite: colors.accentPurple,
  legend: '#E8C04A',
};

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

/** Short tier name (e.g. "Bronze") — no "Runner"/"Grinder"/etc. suffix from the catalog display_name. */
export function shortRankTierName(tierId: string | null | undefined, fallbackTitle?: string): string {
  if (tierId) {
    return tierId.charAt(0).toUpperCase() + tierId.slice(1);
  }

  return fallbackTitle ?? 'Unranked';
}
