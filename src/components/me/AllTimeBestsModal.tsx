import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DISTANCE_MILESTONES,
  type DistanceMilestoneKey,
} from '../../services/activityStreams';
import { usePurchases } from '../../context';
import { PaywallScreen } from '../premium';
import { distanceMilestoneLabel, fetchAllTimeBests, type AllTimeBest } from '../../services/distanceRecords';
import { formatDurationClock } from '../../services/distanceService';
import { colors, spacing } from '../../theme';
import { AllTimeBestsChart } from './AllTimeBestsChart';

type AllTimeBestsModalProps = {
  visible: boolean;
  onClose: () => void;
  onOpenRun?: (activityId: string) => void;
  initialDistanceKey?: DistanceMilestoneKey;
};

type BestEntry = AllTimeBest & {
  isCurrent: boolean;
  improvementSeconds: number | null;
};

type RangeKey = 'all' | '1y' | '6m' | '3m';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'all', label: 'ALL TIME' },
  { key: '1y', label: '1 YEAR' },
  { key: '6m', label: '6 MONTHS' },
  { key: '3m', label: '3 MONTHS' },
];

function rangeCutoff(range: RangeKey): Date | null {
  if (range === 'all') return null;
  const cutoff = new Date();
  if (range === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);
  if (range === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
  if (range === '3m') cutoff.setMonth(cutoff.getMonth() - 3);
  return cutoff;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSignedDuration(seconds: number): string {
  const sign = seconds < 0 ? '+' : '-';
  return `${sign}${formatDurationClock(Math.abs(seconds))}`;
}

export function AllTimeBestsModal({
  visible,
  onClose,
  onOpenRun,
  initialDistanceKey,
}: AllTimeBestsModalProps) {
  const insets = useSafeAreaInsets();
  const { isPremium } = usePurchases();
  const [distanceKey, setDistanceKey] = useState<DistanceMilestoneKey>(initialDistanceKey ?? 'mile');
  const [range, setRange] = useState<RangeKey>('all');
  const [bests, setBests] = useState<AllTimeBest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && initialDistanceKey) setDistanceKey(initialDistanceKey);
  }, [visible, initialDistanceKey]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setLoading(true);

    fetchAllTimeBests(distanceKey)
      .then((rows) => {
        if (cancelled) return;
        setBests(rows);
        setSelectedActivityId(rows[rows.length - 1]?.activityId ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setBests([]);
          setSelectedActivityId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, distanceKey]);

  const visibleBests = useMemo(() => {
    const cutoff = rangeCutoff(range);
    if (!cutoff) return bests;
    return bests.filter((best) => new Date(best.achievedAt) >= cutoff);
  }, [bests, range]);

  // Newest first for the list — each entry keeps the improvement over the
  // record immediately before it chronologically (computed before reversing).
  const entries: BestEntry[] = useMemo(() => {
    return visibleBests
      .map((best, index) => {
        const previous = visibleBests[index - 1];
        return {
          ...best,
          isCurrent: index === visibleBests.length - 1,
          improvementSeconds: previous ? previous.splitSeconds - best.splitSeconds : null,
        };
      })
      .reverse();
  }, [visibleBests]);

  const firstBest = visibleBests[0] ?? null;
  const latestBest = visibleBests[visibleBests.length - 1] ?? null;
  const improvementVsFirst =
    firstBest && latestBest && firstBest.activityId !== latestBest.activityId
      ? firstBest.splitSeconds - latestBest.splitSeconds
      : null;
  const improvementPercent =
    improvementVsFirst != null && firstBest ? (improvementVsFirst / firstBest.splitSeconds) * 100 : null;

  const distanceLabel = distanceMilestoneLabel(distanceKey);

  if (!isPremium) {
    return (
      <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
        <PaywallScreen message="Unlock in-depth personal best tracking and more!" onClose={onClose} />
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={8} onPress={onClose}>
            <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
          </Pressable>
          <Text numberOfLines={1} style={styles.title}>
            {distanceLabel.toUpperCase()} BESTS
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.distancePicker}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.distancePickerScroll}
        >
          {DISTANCE_MILESTONES.map((milestone) => {
            const isActive = milestone.key === distanceKey;
            return (
              <Pressable
                key={milestone.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setDistanceKey(milestone.key)}
                style={[styles.pill, isActive && styles.pillActive]}
              >
                <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>
                  {milestone.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentLime} />
          </View>
        ) : visibleBests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No runs long enough to set a {distanceLabel} record yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {latestBest ? (
              <View style={styles.heroCard}>
                <View style={styles.heroLeft}>
                  <View>
                    <Text style={styles.heroLabel}>BEST {distanceLabel.toUpperCase()} TIME</Text>
                    <Text style={styles.heroValue}>{formatDurationClock(latestBest.splitSeconds)}</Text>
                    <Text style={styles.heroMeta}>Achieved {formatDate(latestBest.achievedAt)}</Text>
                  </View>
                </View>

                {improvementVsFirst != null && improvementVsFirst > 0 ? (
                  <>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroRight}>
                      <Text style={styles.heroLabel}>IMPROVEMENT</Text>
                      <Text style={styles.heroImprovement}>{formatSignedDuration(improvementVsFirst)}</Text>
                      <Text style={styles.heroMeta}>vs first best</Text>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}

            {improvementPercent != null && improvementPercent > 0 ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  Keep it up! You've improved by{' '}
                  <Text style={styles.bannerHighlight}>{improvementPercent.toFixed(1)}%</Text> since your
                  first best {distanceLabel}.
                </Text>
              </View>
            ) : null}

            <View style={styles.rangeRow}>
              {RANGE_OPTIONS.map((option) => {
                const isActive = option.key === range;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => setRange(option.key)}
                    style={[styles.rangePill, isActive && styles.rangePillActive]}
                  >
                    <Text style={[styles.rangePillLabel, isActive && styles.rangePillLabelActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>BEST {distanceLabel.toUpperCase()} TIME OVER TIME</Text>
              <AllTimeBestsChart
                bests={visibleBests}
                onSelectPoint={setSelectedActivityId}
                selectedActivityId={selectedActivityId}
              />
            </View>

            {improvementVsFirst != null && firstBest && latestBest ? (
              <View style={styles.statTilesRow}>
                <View style={styles.statTile}>
                  <Text style={styles.statTileLabel}>TOTAL IMPROVEMENT</Text>
                  <Text style={styles.statTileValue}>{formatSignedDuration(improvementVsFirst)}</Text>
                  {improvementPercent != null ? (
                    <Text style={styles.statTileMeta}>{improvementPercent.toFixed(1)}% faster</Text>
                  ) : null}
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statTileLabel}>FIRST BEST</Text>
                  <Text style={styles.statTileValue}>{formatDurationClock(firstBest.splitSeconds)}</Text>
                  <Text style={styles.statTileMeta}>{formatDate(firstBest.achievedAt)}</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statTileLabel}>LATEST BEST</Text>
                  <Text style={styles.statTileValue}>{formatDurationClock(latestBest.splitSeconds)}</Text>
                  <Text style={styles.statTileMeta}>{formatDate(latestBest.achievedAt)}</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.listTitle}>ALL BEST {distanceLabel.toUpperCase()} TIMES</Text>
            <View style={styles.list}>
              {entries.map((entry) => {
                const isSelected = entry.activityId === selectedActivityId;
                return (
                  <Pressable
                    accessibilityHint="Opens this run's details"
                    accessibilityRole="button"
                    key={entry.activityId}
                    onPress={() => {
                      setSelectedActivityId(entry.activityId);
                      onOpenRun?.(entry.activityId);
                    }}
                    style={[styles.row, isSelected && styles.rowSelected]}
                  >
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTime, entry.isCurrent && styles.rowTimeCurrent]}>
                        {formatDurationClock(entry.splitSeconds)}
                      </Text>
                      <Text style={styles.rowDate}>{formatDate(entry.achievedAt)}</Text>
                    </View>
                    {onOpenRun ? (
                      <View style={styles.openRunButton}>
                        <Text style={styles.openRunLabel}>View Details</Text>
                        <Ionicons color={colors.textSecondary} name="chevron-forward" size={16} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 22,
  },
  distancePickerScroll: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  distancePicker: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  pill: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.accentLime,
    borderColor: colors.accentLime,
  },
  pillLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  pillLabelActive: {
    color: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  heroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroValue: {
    color: colors.accentLime,
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  heroMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  heroRight: {
    paddingHorizontal: spacing.xs,
  },
  heroImprovement: {
    color: colors.accentPurple,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  bannerHighlight: {
    color: colors.accentLime,
    fontWeight: '800',
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  rangePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  rangePillActive: {
    backgroundColor: colors.accentLime,
  },
  rangePillLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rangePillLabelActive: {
    color: colors.background,
  },
  chartSection: {
    gap: spacing.sm,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statTilesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  statTileLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  statTileValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  statTileMeta: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  listTitle: {
    color: colors.textSecondary,
    fontSize: 11,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.accentLime,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTime: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  rowTimeCurrent: {
    color: colors.accentLime,
  },
  rowDate: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  openRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: spacing.xs,
  },
  openRunLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
