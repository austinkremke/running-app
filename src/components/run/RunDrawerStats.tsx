import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type StatColumn = {
  icon: ComponentProps<typeof Ionicons>['name'];
  value: string;
  unit?: string;
  label: string;
};

const DEFAULT_STATS: StatColumn[] = [
  { icon: 'footsteps-outline', value: '0.00', unit: ' mi', label: 'Distance' },
  { icon: 'timer-outline', value: '00:00', label: 'Duration' },
  { icon: 'speedometer-outline', value: '0:00', unit: ' /mi', label: 'Avg Pace' },
];

type RunDrawerStatsProps = {
  stats?: StatColumn[];
};

export function RunDrawerStats({ stats = DEFAULT_STATS }: RunDrawerStatsProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={styles.columnGroup}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.column}>
            <Ionicons color={colors.accentLime} name={stat.icon} size={18} />
            <View style={styles.valueRow}>
              <Text style={styles.value}>{stat.value}</Text>
              {stat.unit ? <Text style={styles.unit}>{stat.unit}</Text> : null}
            </View>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  columnGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  unit: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '400',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
});
