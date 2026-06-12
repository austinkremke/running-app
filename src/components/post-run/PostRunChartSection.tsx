import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PostRunChartTab, PostRunSummary } from '../../mock';
import { colors, spacing } from '../../theme';
import { buildPaceYLabels, PostRunLineChart } from './PostRunLineChart';

type PostRunChartSectionProps = {
  summary: Pick<PostRunSummary, 'chartData' | 'chartReferenceLines' | 'distanceMiles'>;
};

const TABS: { key: PostRunChartTab; label: string }[] = [
  { key: 'pace', label: 'PACE' },
  { key: 'elevation', label: 'ELEVATION' },
  { key: 'heartRate', label: 'HEART RATE' },
];

export function PostRunChartSection({ summary }: PostRunChartSectionProps) {
  const [activeTab, setActiveTab] = useState<PostRunChartTab>('pace');
  const data = summary.chartData[activeTab];

  const chartConfig = useMemo(() => {
    const values = data.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (activeTab === 'pace') {
      return {
        yLabels: buildPaceYLabels(minValue, maxValue),
        yUnit: '/mi',
        referenceValue: summary.chartReferenceLines.pace,
      };
    }

    if (activeTab === 'elevation') {
      const step = (maxValue - minValue) / 3;
      return {
        yLabels: [0, 1, 2, 3].map((index) => String(Math.round(maxValue - step * index))),
        yUnit: 'ft',
        referenceValue: undefined,
      };
    }

    const step = (maxValue - minValue) / 3;
    return {
      yLabels: [0, 1, 2, 3].map((index) => String(Math.round(maxValue - step * index))),
      yUnit: 'bpm',
      referenceValue: summary.chartReferenceLines.heartRate,
    };
  }, [activeTab, data, summary.chartReferenceLines.pace, summary.chartReferenceLines.heartRate]);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tab}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              <View style={[styles.tabIndicator, !isActive && styles.tabIndicatorHidden]} />
            </Pressable>
          );
        })}
      </View>

      <PostRunLineChart
        data={data}
        referenceValue={chartConfig.referenceValue}
        xMaxMiles={summary.distanceMiles}
        yLabels={chartConfig.yLabels}
        yUnit={chartConfig.yUnit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.accentLime,
  },
  tabIndicator: {
    alignSelf: 'stretch',
    height: 2,
    marginTop: spacing.xs,
    borderRadius: 1,
    backgroundColor: colors.accentLime,
  },
  tabIndicatorHidden: {
    backgroundColor: 'transparent',
  },
});
