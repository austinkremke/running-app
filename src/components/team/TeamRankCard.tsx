import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamRank } from '../../mock';
import { colors, spacing } from '../../theme';

type TeamRankCardProps = {
  teamRank: TeamRank;
};

export function TeamRankCard({ teamRank }: TeamRankCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Team Rank</Text>
      <Text style={styles.rank}>#{teamRank.rank}</Text>

      <View style={styles.footer}>
        <Ionicons color={colors.accentLime} name="ribbon" size={16} />
        <View style={styles.footerText}>
          <Text numberOfLines={1} style={styles.topPercent}>
            {teamRank.topPercent}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {teamRank.subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 76,
    alignSelf: 'stretch',
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: 'space-between',
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
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  footerText: {
    flex: 1,
    minWidth: 0,
  },
  topPercent: {
    color: colors.accentLime,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 7,
    lineHeight: 10,
  },
});
