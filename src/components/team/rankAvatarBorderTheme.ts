import { colors } from '../../theme';
import type { RankBorderTierId } from './rankBorderLayout';
import { isRankBorderTier, rankBorderAvatarLayout } from './rankBorderLayout';

export type { RankBorderAvatarLayout, RankBorderTierId } from './rankBorderLayout';
export { rankBorderAvatarLayout } from './rankBorderLayout';

export type RankBorderGradientStop = { offset: string; color: string };

function metallicSweep(light: string, base: string, dark: string): RankBorderGradientStop[] {
  return [
    { offset: '0%', color: light },
    { offset: '18%', color: base },
    { offset: '38%', color: dark },
    { offset: '55%', color: base },
    { offset: '72%', color: light },
    { offset: '88%', color: base },
    { offset: '100%', color: dark },
  ];
}

export const RANK_TIER_COLORS: Record<RankBorderTierId, string> = {
  bronze: '#CD8B5E',
  silver: '#B8C8DC',
  gold: colors.accentGold,
  elite: colors.accentPurple,
  legend: '#3ED17A',
};

/** Diagonal metallic-shimmer gradient stops per tier, used for the SVG ring stroke. */
export const RANK_BORDER_GRADIENT_STOPS: Record<RankBorderTierId, RankBorderGradientStop[]> = {
  bronze: metallicSweep('#FFD9AE', '#CD8B5E', '#7A4A28'),
  silver: metallicSweep('#FFFFFF', '#B8C8DC', '#6B7A8F'),
  gold: metallicSweep('#FFF3B0', colors.accentGold, '#A6791C'),
  elite: metallicSweep('#D9C2FF', colors.accentPurple, '#5A2FA0'),
  legend: metallicSweep('#C6FFDD', '#3ED17A', '#158A4C'),
};

export function rankBorderGradientStopsForTier(
  tierId: string | null | undefined,
): RankBorderGradientStop[] | null {
  if (!isRankBorderTier(tierId)) {
    return null;
  }

  return RANK_BORDER_GRADIENT_STOPS[tierId];
}

/**
 * Returns the validated tier id when a rank border should render, or null otherwise.
 * Callers that only need to know "does this rank get a border" can keep doing `!= null`.
 */
export function rankBorderSourceForTier(tierId: string | null | undefined): RankBorderTierId | null {
  return isRankBorderTier(tierId) ? tierId : null;
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
