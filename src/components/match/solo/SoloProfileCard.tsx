import { StyleSheet, Text, View } from 'react-native';

import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { rankBorderSourceForTier, rankTierColorForTier, shortRankTierName } from '../../team/rankAvatarBorderTheme';
import { colors, spacing } from '../../../theme';

type SoloProfileCardProps = {
  name: string;
  avatarUrl: string;
  level: number;
  rankTitle: string;
  rankTierId?: string | null;
  competitiveRating?: number;
};

const AVATAR_FRAME_SIZE = 72;
const PLAIN_AVATAR_SIZE = 64;

export function SoloProfileCard({
  name,
  avatarUrl,
  level,
  rankTitle,
  rankTierId,
  competitiveRating,
}: SoloProfileCardProps) {
  const hasRankBorder = rankBorderSourceForTier(rankTierId) != null;
  const avatarSize = hasRankBorder ? AVATAR_FRAME_SIZE : PLAIN_AVATAR_SIZE;
  const tierName = shortRankTierName(rankTierId, rankTitle);
  const tierColor = rankTierColorForTier(rankTierId);

  return (
    <View style={styles.card}>
      <RankBorderAvatar avatarUrl={avatarUrl} rankTierId={rankTierId} size={avatarSize} />

      <View style={styles.rightColumn}>
        <Text style={styles.name}>{name}</Text>

        <View style={styles.levelRankRow}>
          <View style={styles.levelBlock}>
            <Text style={styles.label}>LEVEL</Text>
            <Text style={styles.levelValue}>{level}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rankBlock}>
            <Text style={styles.rankHeaderLine}>
              <Text style={styles.label}>RANK: </Text>
              <Text style={[styles.rankTitleText, { color: tierColor }]}>{tierName}</Text>
            </Text>
            {competitiveRating != null ? (
              <Text style={styles.ratingLine}>
                <Text style={styles.ratingValue}>{competitiveRating.toLocaleString()}</Text>
                <Text style={styles.ratingSuffix}> Power Rating</Text>
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'visible',
  },
  rightColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  levelRankRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  levelBlock: {
    minWidth: 44,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  levelValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 30,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  rankBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rankHeaderLine: {
    marginTop: 0,
  },
  rankTitleText: {
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  ratingLine: {
    marginTop: spacing.xs,
  },
  ratingValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  ratingSuffix: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
