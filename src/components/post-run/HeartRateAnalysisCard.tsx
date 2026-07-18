import { StyleSheet, Text, View } from 'react-native';

import { formatDurationClock, formatPace } from '../../services/distanceService';
import { colors, spacing } from '../../theme';
import type { HeartRateAnalysisResult, HrZoneKey } from '../../types/heartRateAnalysis';

type HeartRateAnalysisCardProps = {
  result: HeartRateAnalysisResult;
};

const ZONE_COLORS: Record<HrZoneKey, string> = {
  recovery: colors.accentPurple,
  easy: colors.accentLime,
  steady: colors.accentGold,
  hard: colors.accentOrange,
  maximum: colors.danger,
};

function formatBpmRange(low: number | null, high: number | null): string {
  if (low != null && high != null) return `${low}–${high} bpm`;
  if (high != null) return `Below ${high} bpm`;
  if (low != null) return `${low}+ bpm`;
  return '—';
}

function CardHeader() {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.title}>Heart Rate Analysis</Text>
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumBadgeText}>PREMIUM</Text>
      </View>
    </View>
  );
}

export function HeartRateAnalysisCard({ result }: HeartRateAnalysisCardProps) {
  if (result.state === 'unavailable') {
    return (
      <View style={styles.container}>
        <CardHeader />
        <Text style={styles.classification}>Heart rate analysis unavailable</Text>
        <Text style={styles.insight}>{result.reason}</Text>
      </View>
    );
  }

  const maxPercent = Math.max(...result.zones.map((z) => z.percentOfValidTime), 1);

  return (
    <View style={styles.container}>
      <CardHeader />
      <Text style={styles.classification}>{result.profile}</Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryLabel}>AVERAGE</Text>
          <Text style={styles.summaryValue}>{Math.round(result.avgBpm)} bpm</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryLabel}>MAXIMUM SUSTAINED</Text>
          <Text style={styles.summaryValue}>{Math.round(result.maxSustainedBpm)} bpm</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryLabel}>PRIMARY ZONE</Text>
          <Text style={styles.summaryValue}>{result.zones.find((z) => z.key === result.primaryZone)?.label ?? '—'}</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryLabel}>COVERAGE</Text>
          <Text style={styles.summaryValue}>{Math.round(result.validCoveragePercent)}%</Text>
        </View>
      </View>
      <Text style={styles.zoneMethod}>Zones: {result.zoneMethod}</Text>

      <Text style={styles.insight}>{result.insight}</Text>

      <View style={styles.zoneList}>
        {result.zones.map((zone) => {
          const barWidth = `${Math.max(4, (zone.percentOfValidTime / maxPercent) * 100)}%` as `${number}%`;
          return (
            <View key={zone.key} style={styles.zoneRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.rangeLabel}>{zone.label}</Text>
                <Text style={styles.rangeMeta}>
                  {formatDurationClock(zone.timeSeconds)} · {Math.round(zone.percentOfValidTime)}%
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: barWidth, backgroundColor: ZONE_COLORS[zone.key] }]} />
              </View>
              <Text style={styles.boundaryText}>{formatBpmRange(zone.bpmLow, zone.bpmHigh)}</Text>
            </View>
          );
        })}
      </View>

      {result.drift ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart-Rate Drift</Text>
          <View style={styles.driftRow}>
            <View style={styles.driftCol}>
              <Text style={styles.thirdLabel}>First half</Text>
              <Text style={styles.thirdValue}>{Math.round(result.drift.firstHalfAvgBpm)} bpm</Text>
              <Text style={styles.thirdSubLabel}>{formatPace(result.drift.firstHalfAdjustedPaceSecPerMile)}/mi GAP</Text>
            </View>
            <View style={styles.driftCol}>
              <Text style={styles.thirdLabel}>Second half</Text>
              <Text style={styles.thirdValue}>{Math.round(result.drift.secondHalfAvgBpm)} bpm</Text>
              <Text style={styles.thirdSubLabel}>{formatPace(result.drift.secondHalfAdjustedPaceSecPerMile)}/mi GAP</Text>
            </View>
          </View>
          <View style={styles.pacingBadge}>
            <Text style={styles.pacingBadgeText}>{result.drift.classification}</Text>
          </View>
        </View>
      ) : null}

      {result.paceHrRelationship ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pace &amp; Heart Rate</Text>
          <View style={styles.pacingBadge}>
            <Text style={styles.pacingBadgeText}>{result.paceHrRelationship}</Text>
          </View>
        </View>
      ) : null}

      {result.sustainedSegments.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sustained High-Intensity Segments</Text>
          {result.sustainedSegments.map((segment) => (
            <View key={segment.index} style={styles.segmentRow}>
              <Text style={styles.segmentTitle}>
                Mile {segment.startDistanceMiles.toFixed(1)}–{segment.endDistanceMiles.toFixed(1)} ·{' '}
                {formatDurationClock(segment.durationSeconds)}
              </Text>
              <Text style={styles.boundaryText}>
                {Math.round(segment.avgBpm)} bpm avg · {formatPace(segment.avgActualPaceSecPerMile)}/mi
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {result.confidenceNote ? <Text style={styles.confidenceNote}>{result.confidenceNote}</Text> : null}
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryStat: {
    minWidth: 100,
    gap: 2,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  zoneMethod: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  insight: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  zoneList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  zoneRow: {
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
  section: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  driftRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  driftCol: {
    gap: 2,
  },
  thirdLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  thirdValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  thirdSubLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  pacingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  pacingBadgeText: {
    color: colors.accentOrange,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  segmentRow: {
    gap: 2,
  },
  segmentTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  confidenceNote: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
