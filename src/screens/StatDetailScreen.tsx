import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WeeklyTrendChart } from '../components/me';
import { HeaderIconButton } from '../components/header';
import { formatDurationClock, formatPace } from '../services/distanceService';
import {
  fetchWeeklyStatsBundle,
  type StatMetricKey,
  type WeeklyPoint,
} from '../services/profileHistoryService';
import { colors, spacing } from '../theme';

export type StatDetailTarget = {
  metricKey: StatMetricKey;
  label: string;
  lifetimeValue?: string;
};

type StatDetailScreenProps = {
  target: StatDetailTarget;
  userId: string;
  onBack?: () => void;
};

const AXIS_FORMAT: Record<StatMetricKey, (value: number) => string> = {
  distance: (value) => `${value.toFixed(0)} mi`,
  calories: (value) => `${Math.round(value).toLocaleString()}`,
  time: (value) => (value >= 60 ? `${(value / 60).toFixed(0)}h` : `${Math.round(value)}m`),
  elevation: (value) => `${Math.round(value)} ft`,
  runs: (value) => `${Math.round(value)}`,
  pace: (value) => (value > 0 ? formatPace(value) : '--'),
};

const BIG_FORMAT: Record<StatMetricKey, (value: number) => string> = {
  distance: (value) => `${value.toFixed(2)} mi`,
  calories: (value) => `${Math.round(value).toLocaleString()} cal`,
  time: (value) => formatDurationClock(value * 60),
  elevation: (value) => `${Math.round(value).toLocaleString()} ft`,
  runs: (value) => `${Math.round(value)}`,
  pace: (value) => (value > 0 ? `${formatPace(value)} /mi` : '--'),
};

export function StatDetailScreen({ target, userId, onBack }: StatDetailScreenProps) {
  const [points, setPoints] = useState<WeeklyPoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchWeeklyStatsBundle(userId)
      .then((bundle) => {
        if (!cancelled) setPoints(bundle[target.metricKey]);
      })
      .catch((error) => {
        console.warn('Failed to load weekly stat history', error);
        if (!cancelled) setPoints([]);
      });

    return () => {
      cancelled = true;
    };
  }, [target.metricKey, userId]);

  const currentWeek = points?.[points.length - 1]?.value ?? 0;
  const axisFormat = AXIS_FORMAT[target.metricKey];
  const bigFormat = BIG_FORMAT[target.metricKey];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <HeaderIconButton accessibilityLabel="Go back" icon="chevron-back" onPress={onBack} />
        <Text style={styles.headerTitle}>{target.label.toUpperCase()}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {points == null ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accentLime} />
          </View>
        ) : (
          <>
            <View style={styles.thisWeekBlock}>
              <Text style={styles.thisWeekLabel}>THIS WEEK</Text>
              <Text style={styles.thisWeekValue}>{bigFormat(currentWeek)}</Text>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Past {points.length} Weeks</Text>
              <WeeklyTrendChart formatValue={axisFormat} points={points} />
            </View>

            {target.lifetimeValue ? (
              <View style={styles.lifetimeRow}>
                <Text style={styles.lifetimeLabel}>Lifetime</Text>
                <Text style={styles.lifetimeValue}>{target.lifetimeValue}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  loadingBox: {
    paddingTop: spacing.xl * 2,
    alignItems: 'center',
  },
  thisWeekBlock: {
    gap: 2,
  },
  thisWeekLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  thisWeekValue: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chartTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  lifetimeLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  lifetimeValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
