import { Pressable, StyleSheet, View } from 'react-native';

import type { OverallStat } from '../../mock';
import { spacing } from '../../theme';
import { SectionHeader } from './SectionHeader';
import { StatCard } from './StatCard';

type OverallStatsSectionProps = {
  stats: OverallStat[];
  onStatPress?: (stat: OverallStat) => void;
};

function StatCardTappable({
  stat,
  onStatPress,
}: {
  stat: OverallStat;
  onStatPress?: (stat: OverallStat) => void;
}) {
  if (!stat.metricKey || !onStatPress) {
    return <StatCard stat={stat} />;
  }

  return (
    <Pressable
      accessibilityLabel={`View ${stat.label} history`}
      accessibilityRole="button"
      onPress={() => onStatPress(stat)}
      style={({ pressed }) => [styles.pressableCard, pressed && styles.pressed]}
    >
      <StatCard stat={stat} />
    </Pressable>
  );
}

function chunkStats<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

export function OverallStatsSection({ stats, onStatPress }: OverallStatsSectionProps) {
  const gridStats = stats.filter((stat) => stat.layout !== 'wide');
  const wideStats = stats.filter((stat) => stat.layout === 'wide');
  const gridRows = chunkStats(gridStats, 3);

  return (
    <View style={styles.container}>
      <SectionHeader title="OVERALL STATS" />

      <View style={styles.grid}>
        {gridRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((stat) => (
              <StatCardTappable key={stat.id} onStatPress={onStatPress} stat={stat} />
            ))}
            {row.length < 3
              ? Array.from({ length: 3 - row.length }, (_, index) => (
                  <View key={`spacer-${index}`} style={styles.spacer} />
                ))
              : null}
          </View>
        ))}

        {wideStats.length > 0 ? (
          <View style={styles.row}>
            {wideStats.map((stat) => (
              <StatCardTappable key={stat.id} onStatPress={onStatPress} stat={stat} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  pressableCard: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
