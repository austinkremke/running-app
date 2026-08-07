import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { PostRunLineChart } from '../post-run/PostRunLineChart';
import type { PostRunChartPoint, PostRunChartTab } from '../../mock';
import { colors, spacing } from '../../theme';
import { buildChartAxisConfig, chartTabLabel } from '../../utils/chartConfig';

type FeedChartSlideProps = {
  tab: PostRunChartTab;
  data: PostRunChartPoint[];
  referenceLines: Partial<Record<PostRunChartTab, number>>;
  distanceMiles: number;
  width: DimensionValue;
  height: number;
};

/** Compact chart card for the feed carousel — same PostRunLineChart used on
 *  the run detail screen (dark card, lime line/fill), just always-labeled
 *  instead of tab-switchable since a feed card shows one chart per slide. */
const LABEL_ROW_HEIGHT = 22;
/** PostRunLineChart reserves this much extra height below its own `height`
 *  prop for the x-axis distance-tick row (`container`'s `minHeight` is
 *  `height + 24`) — must be subtracted here too or the two combined still
 *  overflow the card and get vertically cropped/overlapping again. */
const CHART_X_AXIS_ROW_HEIGHT = 24;

export function FeedChartSlide({ tab, data, referenceLines, distanceMiles, width, height }: FeedChartSlideProps) {
  const config = buildChartAxisConfig(tab, data, referenceLines);
  if (!config) return null;

  return (
    <View style={[styles.card, { width, height }]}>
      <Text style={styles.label}>{chartTabLabel(tab)}</Text>
      <View style={styles.chartWrap}>
        <PostRunLineChart
          data={data}
          height={height - LABEL_ROW_HEIGHT - spacing.sm - CHART_X_AXIS_ROW_HEIGHT}
          referenceValue={config.referenceValue}
          xMaxMiles={distanceMiles}
          yLabels={config.yLabels}
          yUnit={config.yUnit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  label: {
    height: LABEL_ROW_HEIGHT,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  chartWrap: {
    overflow: 'hidden',
  },
});
