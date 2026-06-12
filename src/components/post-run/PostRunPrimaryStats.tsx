import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type PrimaryStat = {
  label: string;
  value: string;
  unit: string;
};

type PostRunPrimaryStatsProps = {
  stats: PrimaryStat[];
};

function StatRow({ stats }: { stats: PrimaryStat[] }) {
  return (
    <View style={styles.row}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={styles.columnGroup}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.column}>
            <Text numberOfLines={1} style={styles.label}>
              {stat.label}
            </Text>
            <Text numberOfLines={1} style={styles.value}>
              {stat.value}
            </Text>
            <Text numberOfLines={1} style={styles.unit}>
              {stat.unit}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PostRunPrimaryStats({ stats }: PostRunPrimaryStatsProps) {
  const firstRow = stats.slice(0, 3);
  const secondRow = stats.slice(3, 6);

  return (
    <View style={styles.container}>
      <StatRow stats={firstRow} />
      <View style={styles.rowDivider} />
      <StatRow stats={secondRow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  columnGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  value: {
    color: colors.accentLime,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});
