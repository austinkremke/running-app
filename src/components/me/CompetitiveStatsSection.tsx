import { StyleSheet, Text, View } from 'react-native';

import type { CompetitiveStats } from '../../services/competitiveStatsService';
import { cardShadow, colors, spacing } from '../../theme';
import { SectionHeader } from './SectionHeader';

type CompetitiveStatsSectionProps = {
  stats: CompetitiveStats;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function CompetitiveStatsSection({ stats }: CompetitiveStatsSectionProps) {
  if (stats.totalMatches === 0) {
    return null;
  }

  const winRatePercent = stats.wins + stats.losses > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0;

  return (
    <View style={styles.container}>
      <SectionHeader title="COMPETITIVE STATS" />

      <View style={styles.recordRow}>
        <Text style={styles.recordValue}>
          {stats.wins}-{stats.losses}
        </Text>
        <Text style={styles.recordLabel}>Overall Record · {stats.totalMatches} matches</Text>
      </View>

      <View style={styles.grid}>
        <Stat label="Avg Distance / Match" value={`${stats.avgDistancePerMatchMiles.toFixed(1)} mi`} />
        <Stat label="Win Rate" value={`${Math.round(winRatePercent)}%`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  recordRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 2,
    ...cardShadow,
  },
  recordValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  recordLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    gap: 2,
    ...cardShadow,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
});
