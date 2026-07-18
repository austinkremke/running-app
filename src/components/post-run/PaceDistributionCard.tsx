import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDurationClock, formatPace } from '../../services/distanceService';
import { RANGE_EXPLANATIONS } from '../../services/paceDistributionService';
import { colors, spacing } from '../../theme';
import type { PaceDistributionResult, PaceRangeKey, PaceRangeResult } from '../../types/paceAnalysis';

type PaceDistributionCardProps = {
  result: PaceDistributionResult;
};

const RANGE_COLORS: Record<PaceRangeKey, string> = {
  recovery: colors.accentPurple,
  easy: colors.accentLime,
  workout: colors.accentOrange,
  hard: colors.danger,
};

function formatBoundary(range: PaceRangeResult): string {
  const { paceLowSecPerMile, paceHighSecPerMile } = range;
  if (paceLowSecPerMile != null && paceHighSecPerMile != null) {
    return `${formatPace(paceLowSecPerMile)}–${formatPace(paceHighSecPerMile)}/mi`;
  }
  if (paceHighSecPerMile != null) {
    return `Faster than ${formatPace(paceHighSecPerMile)}/mi`;
  }
  if (paceLowSecPerMile != null) {
    return `Slower than ${formatPace(paceLowSecPerMile)}/mi`;
  }
  return '—';
}

export function PaceDistributionCard({ result }: PaceDistributionCardProps) {
  const [expandedRange, setExpandedRange] = useState<PaceRangeKey | null>(null);
  const maxPercent = Math.max(...result.ranges.map((r) => r.percentOfMoving), 1);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pace Distribution</Text>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PREMIUM</Text>
        </View>
      </View>

      <Text style={styles.classification}>{result.classification}</Text>

      <View style={styles.list}>
        {result.ranges.map((range) => {
          const isExpanded = expandedRange === range.key;
          const barWidth = `${Math.max(4, (range.percentOfMoving / maxPercent) * 100)}%` as `${number}%`;

          return (
            <Pressable
              key={range.key}
              accessibilityHint="Shows what this pace range means"
              accessibilityRole="button"
              onPress={() => setExpandedRange(isExpanded ? null : range.key)}
              style={styles.row}
            >
              <View style={styles.rowHeader}>
                <Text style={styles.rangeLabel}>{range.label}</Text>
                <Text style={styles.rangeMeta}>
                  {formatDurationClock(range.timeSeconds)} · {Math.round(range.percentOfMoving)}%
                </Text>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: barWidth, backgroundColor: RANGE_COLORS[range.key] }]}
                />
              </View>

              <Text style={styles.boundaryText}>{formatBoundary(range)}</Text>

              {isExpanded ? (
                <Text style={styles.explanationText}>{RANGE_EXPLANATIONS[range.key]}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.insight}>{result.insight}</Text>
      {result.historicalComparison ? (
        <Text style={styles.comparison}>{result.historicalComparison}</Text>
      ) : null}
      {result.confidenceNote ? <Text style={styles.confidenceNote}>{result.confidenceNote}</Text> : null}
      {!result.gradeAdjusted ? (
        <Text style={styles.confidenceNote}>Terrain may affect this distribution.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  premiumBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.accentGold,
  },
  premiumBadgeText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  classification: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  row: {
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  rangeMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  boundaryText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  explanationText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  insight: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  comparison: {
    color: colors.accentLime,
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceNote: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
