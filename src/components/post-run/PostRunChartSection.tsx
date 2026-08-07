import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PostRunChartTab, PostRunSummary } from '../../mock';
import { colors, spacing } from '../../theme';
import { buildChartAxisConfig, chartTabLabel } from '../../utils/chartConfig';
import { PostRunLineChart } from './PostRunLineChart';

type PostRunChartSectionProps = {
  summary: Pick<PostRunSummary, 'chartData' | 'chartReferenceLines' | 'distanceMiles'>;
};

const ALL_TABS: PostRunChartTab[] = ['pace', 'elevation', 'heartRate'];

export function PostRunChartSection({ summary }: PostRunChartSectionProps) {
  const tabs = useMemo(
    () => ALL_TABS.filter((tab) => summary.chartData[tab].length > 0).map((key) => ({ key, label: chartTabLabel(key) })),
    [summary.chartData],
  );
  const [activeTab, setActiveTab] = useState<PostRunChartTab>(tabs[0]?.key ?? 'pace');
  const resolvedTab = tabs.some((tab) => tab.key === activeTab) ? activeTab : tabs[0]?.key;
  const data = resolvedTab ? summary.chartData[resolvedTab] : [];

  const chartConfig = useMemo(
    () => (resolvedTab ? buildChartAxisConfig(resolvedTab, data, summary.chartReferenceLines) : null),
    [data, resolvedTab, summary.chartReferenceLines],
  );

  if (!resolvedTab || !chartConfig || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = tab.key === resolvedTab;

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
