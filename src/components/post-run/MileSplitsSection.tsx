import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MileSplit } from '../../mock';
import { formatPace } from '../../services/distanceService';
import { colors, spacing } from '../../theme';

type MileSplitsSectionProps = {
  splits?: MileSplit[] | null;
};

export function MileSplitsSection({ splits }: MileSplitsSectionProps) {
  const { rows, fastestMile, slowestMile } = useMemo(() => {
    if (!splits || splits.length === 0) {
      return { rows: [] as MileSplit[], fastestMile: null, slowestMile: null };
    }

    // Only full miles compete for fastest/slowest so a short final split isn't
    // unfairly flagged; fall back to all splits when there are no full miles.
    const ranked = splits.filter((split) => !split.isPartial);
    const pool = ranked.length > 0 ? ranked : splits;
    const fastest = pool.reduce((a, b) => (b.paceSeconds < a.paceSeconds ? b : a));
    const slowest = pool.reduce((a, b) => (b.paceSeconds > a.paceSeconds ? b : a));

    return { rows: splits, fastestMile: fastest.mile, slowestMile: slowest.mile };
  }, [splits]);

  const maxPace = useMemo(
    () => rows.reduce((max, split) => Math.max(max, split.paceSeconds), 0),
    [rows],
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mile Splits</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, styles.mileCol]}>MILE</Text>
        <Text style={[styles.headerLabel, styles.barCol]}>PACE</Text>
        <Text style={[styles.headerLabel, styles.elevCol]}>ELEV</Text>
      </View>

      <View style={styles.list}>
        {rows.map((split) => {
          const isFastest = split.mile === fastestMile && rows.length > 1;
          const isSlowest = split.mile === slowestMile && rows.length > 1 && !isFastest;
          const barWidth = maxPace > 0 ? `${Math.max(8, (split.paceSeconds / maxPace) * 100)}%` : '8%';
          const barColor = isFastest ? colors.accentLime : isSlowest ? colors.danger : colors.textSecondary;

          return (
            <View key={split.mile} style={styles.row}>
              <View style={styles.mileCol}>
                <Text style={styles.mileText}>
                  {split.isPartial ? split.distanceMiles.toFixed(2) : split.mile}
                </Text>
              </View>

              <View style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: barWidth as `${number}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={[styles.paceText, isFastest && styles.paceFastest]}>
                  {formatPace(split.paceSeconds)}/mi
                </Text>
              </View>

              <Text style={styles.elevText}>
                {split.elevationChangeFt > 0 ? '+' : ''}
                {split.elevationChangeFt} ft
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mileCol: {
    width: 36,
  },
  mileText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  barCol: {
    flex: 1,
    gap: 3,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  paceText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  paceFastest: {
    color: colors.accentLime,
  },
  elevCol: {
    width: 52,
  },
  elevText: {
    width: 52,
    textAlign: 'right',
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
