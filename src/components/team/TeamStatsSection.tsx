import { StyleSheet, Text, View } from 'react-native';

import type { TeamStat } from '../../mock';
import { colors, spacing } from '../../theme';
import { TeamStatItem } from './TeamStatItem';

type TeamStatsSectionProps = {
  stats: TeamStat[];
};

export function TeamStatsSection({ stats }: TeamStatsSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Stats</Text>

      <View style={styles.row}>
        {stats.map((stat) => (
          <TeamStatItem key={stat.id} stat={stat} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
