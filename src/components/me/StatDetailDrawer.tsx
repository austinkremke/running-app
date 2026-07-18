import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { formatPace } from '../../services/distanceService';
import {
  CURRENT_PERIOD_LABEL,
  fetchStatsTrend,
  type StatMetricKey,
  type TrendPoint,
} from '../../services/profileHistoryService';
import type { OverallStatsRange } from '../../services/profileStatsService';
import { colors, spacing } from '../../theme';
import { BottomSheetDrawer } from '../drawer';
import { BarTrendChart } from './BarTrendChart';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export type StatDetailTarget = {
  metricKey: StatMetricKey;
  label: string;
  icon?: string;
  iconColor?: string;
  /** Pre-formatted current value for the selected range, exactly as shown on the stat card (e.g. "18.4 mi"). */
  currentValue?: string;
};

type StatDetailDrawerProps = {
  visible: boolean;
  target: StatDetailTarget | null;
  userId: string | null;
  /** Which Overall Stats tab was active — controls chart bucket granularity (day/week/month). */
  range?: OverallStatsRange;
  onClose: () => void;
};

const AXIS_FORMAT: Record<StatMetricKey, (value: number) => string> = {
  distance: (value) => `${value.toFixed(0)} mi`,
  calories: (value) => `${Math.round(value).toLocaleString()}`,
  time: (value) => (value >= 60 ? `${(value / 60).toFixed(0)}h` : `${Math.round(value)}m`),
  elevation: (value) => `${Math.round(value)} ft`,
  runs: (value) => `${Math.round(value)}`,
  pace: (value) => (value > 0 ? formatPace(value) : '--'),
};

const CHART_TITLE: Record<OverallStatsRange, string> = {
  week: 'Past 7 Days',
  month: 'Past 5 Weeks',
  year: 'Past 12 Months',
  all: 'Past 24 Months',
};

export function StatDetailDrawer({ visible, target, userId, range = 'all', onClose }: StatDetailDrawerProps) {
  const [points, setPoints] = useState<TrendPoint[] | null>(null);

  useEffect(() => {
    if (!visible || !target || !userId) {
      setPoints(null);
      return;
    }

    let cancelled = false;

    fetchStatsTrend(userId, range)
      .then((bundle) => {
        if (!cancelled) setPoints(bundle[target.metricKey]);
      })
      .catch((error) => {
        console.warn('Failed to load stat history', error);
        if (!cancelled) setPoints([]);
      });

    return () => {
      cancelled = true;
    };
  }, [target, userId, visible, range]);

  const axisFormat = target ? AXIS_FORMAT[target.metricKey] : undefined;

  return (
    <BottomSheetDrawer heightRatio={0.68} onClose={onClose} visible={visible && target != null}>
      {target ? (
        <View style={styles.container}>
          <View style={styles.titleRow}>
            {target.icon ? (
              <Ionicons color={target.iconColor ?? colors.accentLime} name={target.icon as IoniconsName} size={18} />
            ) : null}
            <Text style={styles.title}>{target.label}</Text>
          </View>

          {points == null ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.accentLime} />
            </View>
          ) : (
            <>
              <View style={styles.currentPeriodBlock}>
                <Text style={styles.currentPeriodLabel}>{CURRENT_PERIOD_LABEL[range]}</Text>
                <Text style={styles.currentPeriodValue}>{target.currentValue ?? '--'}</Text>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{CHART_TITLE[range]}</Text>
                {axisFormat ? <BarTrendChart formatValue={axisFormat} points={points} /> : null}
              </View>
            </>
          )}
        </View>
      ) : null}
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  currentPeriodBlock: {
    gap: 2,
  },
  currentPeriodLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  currentPeriodValue: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  chartCard: {
    backgroundColor: colors.background,
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
});
