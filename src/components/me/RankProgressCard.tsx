import { StyleSheet, Text, View } from 'react-native';

import type { ProfileRank } from '../../mock';
import { rankTierColorForTier, shortRankTierName } from '../team/rankAvatarBorderTheme';
import { colors, spacing } from '../../theme';
import { XpProgressBar } from './XpProgressBar';

type RankProgressCardProps = {
  rank: ProfileRank;
};

function formatRating(value: number): string {
  return value.toLocaleString('en-US');
}

/** Competitive-mode equivalent of ExperienceCard — same shape/height, but tracks
 * progress toward the next rank tier instead of the next level, so the header
 * doesn't need a separate "Next rank: 1200 Silver" callout anymore. */
export function RankProgressCard({ rank }: RankProgressCardProps) {
  const goal = rank.nextRankGoal;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>POWER RATING</Text>
        {goal ? (
          <Text style={styles.ratingText}>
            <Text style={styles.ratingCurrent}>{formatRating(goal.currentRating)}</Text>
            <Text style={styles.ratingTotal}> / {formatRating(goal.nextTierMinRating)} </Text>
            <Text style={[styles.nextTier, { color: rankTierColorForTier(goal.nextTierId) }]}>
              {shortRankTierName(goal.nextTierId, goal.nextTierTitle)}
            </Text>
          </Text>
        ) : (
          <Text style={styles.ratingText}>
            <Text style={styles.ratingCurrent}>{formatRating(rank.competitiveRating ?? 0)}</Text>
            <Text style={styles.ratingTotal}> MAX RANK</Text>
          </Text>
        )}
      </View>

      <XpProgressBar height={18} progress={goal ? goal.progress : 1} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingCurrent: {
    color: colors.accentLime,
  },
  ratingTotal: {
    color: colors.textSecondary,
  },
  nextTier: {
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
