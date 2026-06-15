import { StyleSheet, View } from 'react-native';

import type { ActiveSoloMatch } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { SoloMatchStatRow } from './SoloMatchStatRow';

type SoloMatchStatsSectionProps = {
  match: ActiveSoloMatch;
};

export function SoloMatchStatsSection({ match }: SoloMatchStatsSectionProps) {
  return (
    <View style={styles.container}>
      {match.stats.map((stat, index) => (
        <SoloMatchStatRow
          awayAccent={match.awayRunner.accent}
          homeAccent={match.homeRunner.accent}
          key={stat.id}
          showDivider={index < match.stats.length - 1}
          stat={stat}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
});
