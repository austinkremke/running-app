import { StyleSheet, Text, View } from 'react-native';

import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { rankBorderSourceForTier, rankTierColorForTier } from '../../team/rankAvatarBorderTheme';
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

  return (
    <View style={styles.card}>
      <RankBorderAvatar avatarUrl={avatarUrl} rankTierId={rankTierId} size={avatarSize} />

      <View style={styles.meta}>
        <Text style={styles.name}>{name}</Text>

        <Text style={[styles.rankTitle, { color: rankTierColorForTier(rankTierId) }]}>
          {rankTitle}
        </Text>

        {competitiveRating != null ? (
          <Text style={styles.ratingLine}>
            <Text style={styles.ratingValue}>{competitiveRating.toLocaleString()}</Text>
            <Text style={styles.ratingSuffix}> Power Rating</Text>
          </Text>
        ) : null}

        <Text style={styles.level}>Level {level}</Text>
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
  meta: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  rankTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  ratingLine: {
    lineHeight: 16,
  },
  ratingValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  ratingSuffix: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  level: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
