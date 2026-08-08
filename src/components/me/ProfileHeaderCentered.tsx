import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { UserProfile } from '../../mock';
import type { SoloRankPosition } from '../../services/rank';
import { colors, spacing } from '../../theme';
import { RANK_TIER_COLORS, rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';
import { FlagIcon } from './FlagIcon';
import { ProfileAvatar } from './ProfileAvatar';

type ProfileHeaderCenteredProps = {
  profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'rank'>;
  /** Device-locale ISO-3166-1 alpha-2 region code shown in the top-left slot; null hides the slot. */
  regionCode?: string | null;
  soloRankPosition?: SoloRankPosition | null;
  onEditAvatar?: () => void;
  /** Rendered in the top-right slot — `MiniXpBar` on the owner's Me tab, omitted (or a
   * different action, e.g. Add Friend) when viewing another user's read-only profile. */
  topRightSlot?: ReactNode;
};

const AVATAR_SIZE = 128;
/** Thinner than the app-wide default (0.065) — this avatar is much larger, so the
 * standard ring reads as too heavy at this scale. */
const AVATAR_RING_RATIO = 0.035;
/** Glow circle is larger than the avatar so it reads as a soft halo behind the ring. */
const GLOW_SIZE_RATIO = 1.5;

/**
 * Centered v2 header layout: country/global solo rank top-left (owner only —
 * omitted when `soloRankPosition` isn't passed), custom top-right slot, large
 * centered avatar, name + colored rank line underneath. Shared between the
 * owner's own Me tab (`MeScreen`, full `topRightSlot`/rank data) and the
 * read-only `UserProfileScreen` for other users (no rank slot, no XP bar —
 * that data doesn't exist for other users — swapping in an Add Friend action
 * instead), so the two profile views stay visually consistent.
 */
export function ProfileHeaderCentered({
  profile,
  regionCode,
  soloRankPosition,
  onEditAvatar,
  topRightSlot,
}: ProfileHeaderCenteredProps) {
  const rankColor = rankTierColorForTier(profile.rank.tierId);
  const rankLabel = shortRankTierName(profile.rank.tierId, profile.rank.title);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.topSlot}>
          {soloRankPosition ? (
            <View style={styles.countryRank}>
              <View style={styles.countryRankTop}>
                <View style={styles.countryRankIcon}>
                  <FlagIcon regionCode={regionCode} width={32} />
                </View>
                <Text style={styles.countryRankValue}>#{soloRankPosition.position}</Text>
              </View>
              <Text style={styles.countryRankLabel}>SOLO RANK</Text>

              {profile.rank.competitiveRating != null ? (
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingPillText}>{profile.rank.competitiveRating.toLocaleString()}</Text>
                  <Text style={styles.ratingPillLabel}>PR</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={[styles.topSlot, styles.topSlotRight]}>{topRightSlot}</View>
      </View>

      <View style={styles.avatarRow}>
        <Svg
          height={AVATAR_SIZE * GLOW_SIZE_RATIO}
          pointerEvents="none"
          style={styles.avatarGlow}
          width={AVATAR_SIZE * GLOW_SIZE_RATIO}
        >
          <Defs>
            <RadialGradient cx="50%" cy="50%" id="avatarGlowGradient" r="50%">
              <Stop offset="0%" stopColor={rankColor} stopOpacity={0.55} />
              <Stop offset="45%" stopColor={rankColor} stopOpacity={0.32} />
              <Stop offset="75%" stopColor={rankColor} stopOpacity={0.1} />
              <Stop offset="100%" stopColor={rankColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect fill="url(#avatarGlowGradient)" height="100%" width="100%" x="0" y="0" />
        </Svg>
        <ProfileAvatar
          avatarUrl={profile.avatarUrl}
          onEditPress={onEditAvatar}
          rankBorderTierId={profile.rank.tierId}
          ringRatio={AVATAR_RING_RATIO}
          size={AVATAR_SIZE}
        />
      </View>

      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.rankLine}>
        <Text style={styles.rankPrefix}>Rank: </Text>
        <Text style={[styles.rankValue, { color: rankColor }]}>{rankLabel}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  topSlot: {
    minHeight: 32,
    justifyContent: 'center',
  },
  topSlotRight: {
    alignItems: 'flex-end',
  },
  countryRank: {
    gap: 4,
  },
  countryRankTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryRankIcon: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryRankValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  countryRankLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    gap: 3,
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RANK_TIER_COLORS.bronze,
    backgroundColor: 'transparent',
  },
  ratingPillText: {
    color: RANK_TIER_COLORS.bronze,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  ratingPillLabel: {
    color: RANK_TIER_COLORS.bronze,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  avatarRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  avatarGlow: {
    position: 'absolute',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  rankLine: {
    fontSize: 14,
    textAlign: 'center',
  },
  rankPrefix: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rankValue: {
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
