import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPace } from '../../services/distanceService';
import { colors, spacing } from '../../theme';
import type { ClimbingAnalysisResult, SignificantClimb } from '../../types/climbingAnalysis';

type ClimbingAnalysisCardProps = {
  result: ClimbingAnalysisResult;
};

function formatFeet(feet: number): string {
  return `${Math.round(feet)} ft`;
}

function formatGrade(gradePercent: number | null): string {
  if (gradePercent == null) return '—';
  const sign = gradePercent > 0 ? '+' : '';
  return `${sign}${gradePercent.toFixed(1)}%`;
}

function CardHeader() {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.title}>Climbing Analysis</Text>
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumBadgeText}>PREMIUM</Text>
      </View>
    </View>
  );
}

function ClimbRow({ climb }: { climb: SignificantClimb }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => setExpanded((v) => !v)}
      style={styles.climbCard}
    >
      <View style={styles.climbHeaderRow}>
        <Text style={styles.climbTitle}>Climb {climb.index + 1}</Text>
        <Text style={styles.climbPosition}>
          Mile {climb.startDistanceMiles.toFixed(1)}–{climb.endDistanceMiles.toFixed(1)}
        </Text>
      </View>

      <View style={styles.climbStatsGrid}>
        <View style={styles.climbStat}>
          <Text style={styles.climbStatLabel}>DISTANCE</Text>
          <Text style={styles.climbStatValue}>{climb.distanceMiles.toFixed(2)} mi</Text>
        </View>
        <View style={styles.climbStat}>
          <Text style={styles.climbStatLabel}>ELEV GAIN</Text>
          <Text style={styles.climbStatValue}>{formatFeet(climb.elevationGainFeet)}</Text>
        </View>
        <View style={styles.climbStat}>
          <Text style={styles.climbStatLabel}>AVG GRADE</Text>
          <Text style={styles.climbStatValue}>{formatGrade(climb.avgGradePercent)}</Text>
        </View>
        <View style={styles.climbStat}>
          <Text style={styles.climbStatLabel}>STEEPEST SUSTAINED</Text>
          <Text style={styles.climbStatValue}>{formatGrade(climb.steepestSustainedGradePercent)}</Text>
        </View>
        <View style={styles.climbStat}>
          <Text style={styles.climbStatLabel}>ACTUAL PACE</Text>
          <Text style={styles.climbStatValue}>{formatPace(climb.actualPaceSecPerMile)}/mi</Text>
        </View>
        <View style={styles.climbStat}>
          <Text style={styles.climbStatLabel}>ADJUSTED PACE</Text>
          <Text style={styles.climbStatValue}>{formatPace(climb.adjustedPaceSecPerMile)}/mi</Text>
        </View>
        {climb.verticalRateFeetPerHour != null ? (
          <View style={styles.climbStat}>
            <Text style={styles.climbStatLabel}>VERTICAL RATE</Text>
            <Text style={styles.climbStatValue}>{Math.round(climb.verticalRateFeetPerHour)} ft/hr</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.pacingBadge}>
        <Text style={styles.pacingBadgeText}>{climb.pacing}</Text>
      </View>

      {expanded && climb.thirds ? (
        <View style={styles.thirdsRow}>
          {['First third', 'Middle third', 'Final third'].map((label, i) => (
            <View key={label} style={styles.thirdCol}>
              <Text style={styles.thirdLabel}>{label}</Text>
              <Text style={styles.thirdValue}>{formatPace(climb.thirds![i].adjustedPaceSecPerMile)}/mi</Text>
              <Text style={styles.thirdSubLabel}>grade-adjusted</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export function ClimbingAnalysisCard({ result }: ClimbingAnalysisCardProps) {
  if (result.state === 'unavailable') {
    return (
      <View style={styles.container}>
        <CardHeader />
        <Text style={styles.classification}>Climbing analysis unavailable</Text>
        <Text style={styles.insight}>{result.reason}</Text>
      </View>
    );
  }

  if (result.state === 'minimal') {
    return (
      <View style={styles.container}>
        <CardHeader />
        <Text style={styles.classification}>Minimal climbing detected</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryStat}>{formatFeet(result.elevationGainFeet)} elevation gain</Text>
          <Text style={styles.summaryStat}>{result.routeClassification}</Text>
        </View>
        <Text style={styles.insight}>{result.message}</Text>
      </View>
    );
  }

  const maxTerrainPercent = Math.max(...result.terrain.map((t) => t.percentOfDistance), 1);

  return (
    <View style={styles.container}>
      <CardHeader />

      <Text style={styles.classification}>{result.routeClassification}</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryStat}>{formatFeet(result.elevationGainFeet)} climbed</Text>
        <Text style={styles.summaryStat}>{result.uphillDistanceMiles.toFixed(1)} mi uphill</Text>
        <Text style={styles.summaryStat}>
          {result.meaningfulClimbCount} meaningful {result.meaningfulClimbCount === 1 ? 'climb' : 'climbs'}
        </Text>
      </View>
      <Text style={styles.summaryStat}>
        Estimated pace impact: {result.estimatedTerrainImpactSecPerMile >= 0 ? '+' : ''}
        {Math.round(result.estimatedTerrainImpactSecPerMile)} sec/mi
      </Text>

      <Text style={styles.insight}>{result.insight}</Text>

      <View style={styles.terrainList}>
        {result.terrain.map((t) => {
          const barWidth = `${Math.max(4, (t.percentOfDistance / maxTerrainPercent) * 100)}%` as `${number}%`;
          return (
            <View key={t.key} style={styles.terrainRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.rangeLabel}>{t.label}</Text>
                <Text style={styles.rangeMeta}>
                  {t.distanceMiles.toFixed(1)} mi · {Math.round(t.percentOfDistance)}%
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: barWidth, backgroundColor: colors.accentPurple }]} />
              </View>
              <Text style={styles.boundaryText}>
                {formatPace(t.avgActualPaceSecPerMile)}/mi actual
                {t.avgAdjustedPaceSecPerMile != null && t.key !== 'flat'
                  ? ` · ${formatPace(t.avgAdjustedPaceSecPerMile)}/mi adjusted`
                  : ''}
              </Text>
            </View>
          );
        })}
      </View>

      {result.climbs.length > 0 ? (
        <View style={styles.climbsList}>
          <Text style={styles.sectionTitle}>Significant Climbs</Text>
          {result.climbs.map((climb) => (
            <ClimbRow key={climb.index} climb={climb} />
          ))}
        </View>
      ) : null}

      {result.downhill ? (
        <View style={styles.downhillSection}>
          <Text style={styles.sectionTitle}>Downhill</Text>
          <Text style={styles.summaryStat}>
            {result.downhill.distanceMiles.toFixed(1)} mi · {formatPace(result.downhill.actualPaceSecPerMile)}/mi actual
            {result.downhill.adjustedPaceSecPerMile != null
              ? ` · ${formatPace(result.downhill.adjustedPaceSecPerMile)}/mi adjusted`
              : ''}
          </Text>
          {result.downhill.classification ? (
            <View style={styles.pacingBadge}>
              <Text style={styles.pacingBadgeText}>{result.downhill.classification}</Text>
            </View>
          ) : null}
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
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryStat: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  insight: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  terrainList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  terrainRow: {
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  climbsList: {
    gap: spacing.sm,
  },
  climbCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  climbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  climbTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  climbPosition: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  climbStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  climbStat: {
    minWidth: 90,
    gap: 2,
  },
  climbStatLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  climbStatValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
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
  thirdsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  thirdCol: {
    flex: 1,
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
  downhillSection: {
    gap: spacing.xs,
  },
  confidenceNote: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
