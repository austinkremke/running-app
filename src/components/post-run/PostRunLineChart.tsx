import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PostRunChartPoint } from '../../mock';
import { colors } from '../../theme';
import { buildDistanceAxisTicks } from '../../utils/chartAxis';

type PostRunLineChartProps = {
  data: PostRunChartPoint[];
  yLabels: string[];
  yUnit?: string;
  xMaxMiles: number;
  referenceValue?: number;
  /** Overrides the default full-detail chart height — used by compact
   *  contexts (e.g. the feed carousel slide) that don't have room for the
   *  default size. Without this, a container shorter than the chart's own
   *  fixed minHeight squeezes/vertically-crops the SVG, which is what made
   *  the value line overlap the label sitting above it. */
  height?: number;
};

const DEFAULT_CHART_HEIGHT = 132;
const PADDING_LEFT = 34;
const PADDING_RIGHT = 8;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 18;

export function PostRunLineChart({
  data,
  yLabels,
  yUnit,
  xMaxMiles,
  referenceValue,
  height = DEFAULT_CHART_HEIGHT,
}: PostRunLineChartProps) {
  const chartHeight = height;
  const plotHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(width - PADDING_LEFT - PADDING_RIGHT, 1);
  const xAxisTicks = useMemo(() => buildDistanceAxisTicks(xMaxMiles), [xMaxMiles]);
  const xMax = Math.max(xMaxMiles, 0.0001);

  const { linePath, areaPath, referenceY } = useMemo(() => {
    if (data.length === 0 || width <= 0) {
      return { linePath: '', areaPath: '', referenceY: null as number | null };
    }

    const values = data.map((point) => point.value);
    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);
    if (minValue === maxValue) {
      const padding = Math.max(Math.abs(minValue) * 0.05, 5);
      minValue -= padding;
      maxValue += padding;
    }
    const valueRange = Math.max(maxValue - minValue, 1);

    const points = data.map((point) => {
      const x = PADDING_LEFT + (point.distanceMiles / xMax) * plotWidth;
      const normalized = (point.value - minValue) / valueRange;
      const y = PADDING_TOP + (1 - normalized) * plotHeight;
      return { x, y };
    });

    const line = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    const area = `${line} L ${points[points.length - 1]?.x ?? PADDING_LEFT} ${
      PADDING_TOP + plotHeight
    } L ${points[0]?.x ?? PADDING_LEFT} ${PADDING_TOP + plotHeight} Z`;

    let refY: number | null = null;
    if (referenceValue != null) {
      const normalized = (referenceValue - minValue) / valueRange;
      refY = PADDING_TOP + (1 - normalized) * plotHeight;
    }

    return { linePath: line, areaPath: area, referenceY: refY };
  }, [data, plotHeight, plotWidth, referenceValue, width, xMax]);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.container, { minHeight: chartHeight + 24 }]}
    >
      <View style={[styles.yAxis, { top: PADDING_TOP, height: plotHeight }]}>
        {yLabels.map((label, index) => (
          <Text key={`y-${index}-${label}`} style={styles.yLabel}>
            {label}
          </Text>
        ))}
        {yUnit ? <Text style={styles.yUnit}>{yUnit}</Text> : null}
      </View>

      {width > 0 ? (
        <Svg height={chartHeight} width={width}>
          <Defs>
            <LinearGradient id="postRunChartFill" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0%" stopColor={colors.accentLime} stopOpacity={0.28} />
              <Stop offset="100%" stopColor={colors.accentLime} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {referenceY != null ? (
            <Line
              stroke={colors.textSecondary}
              strokeDasharray="4 4"
              strokeWidth={1}
              x1={PADDING_LEFT}
              x2={width - PADDING_RIGHT}
              y1={referenceY}
              y2={referenceY}
            />
          ) : null}

          {areaPath ? <Path d={areaPath} fill="url(#postRunChartFill)" /> : null}
          {linePath ? (
            <Path d={linePath} fill="none" stroke={colors.accentLime} strokeWidth={2} />
          ) : null}
        </Svg>
      ) : null}

      <View style={styles.xAxis}>
        {xAxisTicks.map((tick) => (
          <Text key={tick.id} style={styles.xLabel}>
            {tick.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function formatPaceSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function buildPaceYLabels(minSeconds: number, maxSeconds: number): string[] {
  if (minSeconds === maxSeconds) {
    // Genuinely flat (e.g. an imported run with only one real data point) —
    // showing the same value 3 times over implies variation that isn't there.
    return [formatPaceSeconds(maxSeconds)];
  }

  const step = (maxSeconds - minSeconds) / 2;
  const labels = [0, 1, 2].map((index) => formatPaceSeconds(maxSeconds - step * index));
  return labels.filter((label, index) => index === 0 || label !== labels[index - 1]);
}

const styles = StyleSheet.create({
  container: {},
  yAxis: {
    position: 'absolute',
    left: 0,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  yLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  yUnit: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: PADDING_LEFT,
    paddingRight: PADDING_RIGHT,
    marginTop: 2,
  },
  xLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
});
