export type RankBorderTierId = 'bronze' | 'silver' | 'gold' | 'elite' | 'legend';

/** Measured from border PNG assets (inner hole diameter + center nudge in source pixels). */
export type RankBorderAssetMeta = {
  sourceWidth: number;
  sourceHeight: number;
  innerHoleDiameter: number;
  holeCenterOffsetX: number;
  holeCenterOffsetY: number;
};

export const RANK_BORDER_ASSET_META: Record<RankBorderTierId, RankBorderAssetMeta> = {
  bronze: {
    sourceWidth: 390,
    sourceHeight: 406,
    innerHoleDiameter: 284,
    holeCenterOffsetX: 0.7,
    holeCenterOffsetY: -0.1,
  },
  silver: {
    sourceWidth: 400,
    sourceHeight: 400,
    innerHoleDiameter: 252,
    holeCenterOffsetX: -0.2,
    holeCenterOffsetY: -0.3,
  },
  gold: {
    sourceWidth: 398,
    sourceHeight: 400,
    innerHoleDiameter: 266,
    holeCenterOffsetX: -0.2,
    holeCenterOffsetY: -0.9,
  },
  elite: {
    sourceWidth: 393,
    sourceHeight: 419,
    innerHoleDiameter: 252,
    holeCenterOffsetX: 0.1,
    holeCenterOffsetY: -1.4,
  },
  legend: {
    sourceWidth: 418,
    sourceHeight: 421,
    innerHoleDiameter: 238,
    holeCenterOffsetX: -0.3,
    holeCenterOffsetY: -1.2,
  },
};

export type RankBorderAvatarLayout = {
  avatarDiameter: number;
  avatarLeft: number;
  avatarTop: number;
};

/** Avatar diameter as a fraction of the outer frame size (fallback when tier meta is missing). */
export const RANK_BORDER_AVATAR_DIAMETER_RATIO = 0.74;

export function rankBorderAssetMeta(
  tierId: string | null | undefined,
): RankBorderAssetMeta | null {
  if (!tierId || !(tierId in RANK_BORDER_ASSET_META)) {
    return null;
  }

  return RANK_BORDER_ASSET_META[tierId as RankBorderTierId];
}

export function rankBorderAvatarLayout(
  frameSize: number,
  tierId: string | null | undefined,
): RankBorderAvatarLayout {
  const meta = rankBorderAssetMeta(tierId);

  if (!meta) {
    const avatarDiameter = Math.round(frameSize * RANK_BORDER_AVATAR_DIAMETER_RATIO);
    const avatarOffset = (frameSize - avatarDiameter) / 2;

    return {
      avatarDiameter,
      avatarLeft: avatarOffset,
      avatarTop: avatarOffset,
    };
  }

  const scale = Math.min(frameSize / meta.sourceWidth, frameSize / meta.sourceHeight);
  const avatarDiameter = Math.round(meta.innerHoleDiameter * scale);
  const baseOffset = (frameSize - avatarDiameter) / 2;

  return {
    avatarDiameter,
    avatarLeft: baseOffset + meta.holeCenterOffsetX * scale,
    avatarTop: baseOffset + meta.holeCenterOffsetY * scale,
  };
}
