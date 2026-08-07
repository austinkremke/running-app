export type RankBorderTierId = 'bronze' | 'silver' | 'gold' | 'elite' | 'legend';

const RANK_BORDER_TIER_IDS: RankBorderTierId[] = ['bronze', 'silver', 'gold', 'elite', 'legend'];

/** Ring thickness as a fraction of the outer frame size. */
export const RANK_BORDER_RING_RATIO = 0.065;

/** Gap between the ring's inner edge and the avatar, as a fraction of the outer frame size. */
export const RANK_BORDER_GAP_RATIO = 0.035;

export type RankBorderAvatarLayout = {
  avatarDiameter: number;
  avatarLeft: number;
  avatarTop: number;
  ringWidth: number;
};

export function isRankBorderTier(tierId: string | null | undefined): tierId is RankBorderTierId {
  return tierId != null && (RANK_BORDER_TIER_IDS as string[]).includes(tierId);
}

export function rankBorderAvatarLayout(
  frameSize: number,
  tierId: string | null | undefined,
  ringRatio: number = RANK_BORDER_RING_RATIO,
): RankBorderAvatarLayout {
  if (!isRankBorderTier(tierId)) {
    return { avatarDiameter: frameSize, avatarLeft: 0, avatarTop: 0, ringWidth: 0 };
  }

  const ringWidth = Math.max(2, Math.round(frameSize * ringRatio));
  const gap = Math.max(1, Math.round(frameSize * RANK_BORDER_GAP_RATIO));
  const inset = ringWidth + gap;
  const avatarDiameter = frameSize - inset * 2;

  return { avatarDiameter, avatarLeft: inset, avatarTop: inset, ringWidth };
}
