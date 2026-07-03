import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TeamRank } from '../../mock';
import { colors, spacing } from '../../theme';

type TeamRankCardProps = {
  teamRank: TeamRank;
  competitiveRating: number;
  onPress?: () => void;
};

export function TeamRankCard({ teamRank, competitiveRating, onPress }: TeamRankCardProps) {
  return (
    <Pressable
      accessibilityHint="Opens the top teams leaderboard"
      accessibilityLabel={`Team rank ${teamRank.rank}. ${competitiveRating} rating. ${teamRank.topPercent} ${teamRank.subtitle}`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, onPress && pressed && styles.cardPressed]}
    >
      <Text style={styles.label}>Team Rank</Text>
      <Text style={styles.rank}>{teamRank.rank > 0 ? `#${teamRank.rank}` : '—'}</Text>

      <View style={styles.ratingRow}>
        <Ionicons color={colors.accentGold} name="ribbon" size={14} />
        <Text style={styles.rating}>{competitiveRating.toLocaleString()}</Text>
      </View>
      <Text style={styles.ratingLabel}>Power Rating</Text>

      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.topPercent}>
          {teamRank.topPercent}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {teamRank.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    alignSelf: 'stretch',
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'space-between',
    gap: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  rank: {
    color: colors.accentLime,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rating: {
    color: colors.accentGold,
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ratingLabel: {
    color: colors.textSecondary,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 2,
  },
  topPercent: {
    color: colors.accentLime,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 7,
    lineHeight: 10,
    textAlign: 'center',
  },
});
