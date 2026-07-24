import { StyleSheet, Text, View } from 'react-native';

import type { ProfileRank } from '../../mock';
import { rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';
import { cardShadow, colors, spacing } from '../../theme';

type RankSummaryCardProps = {
  rank: ProfileRank;
};

function formatRating(rank: ProfileRank): string {
  if (rank.competitiveRating != null) {
    return rank.competitiveRating.toLocaleString();
  }

  return rank.subtitle.replace(/\s*(rating|points|power rating)$/i, '').trim();
}

export function RankSummaryCard({ rank }: RankSummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tierBlock}>
        <Text style={styles.label}>RANK</Text>
        <Text style={[styles.tierValue, { color: rankTierColorForTier(rank.tierId) }]}>
          {shortRankTierName(rank.tierId, rank.title)}
        </Text>
        <Text style={styles.ratingLine}>
          <Text style={styles.ratingValue}>{formatRating(rank)}</Text>
          <Text style={styles.ratingSuffix}> Power Rating</Text>
        </Text>
      </View>

      {rank.nextRankGoal ? (
        <View style={styles.nextRankBlock}>
          <Text style={styles.nextRankLabel}>Next rank</Text>
          <Text style={styles.nextRankLine}>
            <Text style={styles.nextRankRating}>{rank.nextRankGoal.nextTierMinRating.toLocaleString()}</Text>
            <Text style={styles.nextRankLabel}> </Text>
            <Text style={[styles.nextRankTier, { color: rankTierColorForTier(rank.nextRankGoal.nextTierId) }]}>
              {shortRankTierName(rank.nextRankGoal.nextTierId, rank.nextRankGoal.nextTierTitle)}
            </Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  tierBlock: {
    gap: 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  tierValue: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  ratingLine: {
    marginTop: 2,
  },
  ratingValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  ratingSuffix: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  nextRankBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: 2,
  },
  nextRankLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  nextRankLine: {
    marginTop: 2,
  },
  nextRankRating: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  nextRankTier: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
