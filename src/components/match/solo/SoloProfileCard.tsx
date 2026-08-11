import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { FlagIcon } from '../../me/FlagIcon';
import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { RANK_TIER_COLORS, rankBorderSourceForTier } from '../../team/rankAvatarBorderTheme';
import type { SoloRankPosition } from '../../../services/rank';
import { colors, spacing } from '../../../theme';

type SoloProfileCardProps = {
  avatarUrl: string;
  rankTierId?: string | null;
  competitiveRating?: number;
  soloRankPosition?: SoloRankPosition | null;
  /** Device-locale ISO-3166-1 alpha-2 region code for the country-rank flag; null hides the flag. */
  regionCode?: string | null;
  wins: number;
};

const AVATAR_FRAME_SIZE = 72;
const PLAIN_AVATAR_SIZE = 64;

export function SoloProfileCard({
  avatarUrl,
  rankTierId,
  competitiveRating,
  soloRankPosition,
  regionCode,
  wins,
}: SoloProfileCardProps) {
  const hasRankBorder = rankBorderSourceForTier(rankTierId) != null;
  const avatarSize = hasRankBorder ? AVATAR_FRAME_SIZE : PLAIN_AVATAR_SIZE;

  return (
    <View style={styles.card}>
      <View style={styles.avatarColumn}>
        <RankBorderAvatar avatarUrl={avatarUrl} rankTierId={rankTierId} size={avatarSize} />

        {competitiveRating != null ? (
          <View style={styles.ratingPill}>
            <Text style={styles.ratingPillText}>{competitiveRating.toLocaleString()}</Text>
            <Text style={styles.ratingPillLabel}>PR</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rightColumn}>
        <View style={styles.statCol}>
          <View style={styles.statIconSlot}>
            <Ionicons color={colors.textPrimary} name="globe-outline" size={18} />
          </View>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
            style={styles.statValue}
          >
            {soloRankPosition ? `#${soloRankPosition.position}` : '—'}
          </Text>
          <Text style={styles.statLabel}>GLOBAL RANK</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statCol}>
          <View style={styles.statIconSlot}>
            <FlagIcon regionCode={regionCode} width={22} />
          </View>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
            style={styles.statValue}
          >
            {soloRankPosition ? `#${soloRankPosition.position}` : '—'}
          </Text>
          <Text style={styles.statLabel}>COUNTRY RANK</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statCol}>
          <View style={styles.statIconSlot} />
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
            style={styles.statValue}
          >
            {wins}
          </Text>
          <Text style={styles.statLabel}>WINS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'visible',
  },
  avatarColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
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
  rightColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 3,
    overflow: 'hidden',
  },
  statIconSlot: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  statValue: {
    width: '100%',
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
