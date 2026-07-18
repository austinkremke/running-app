import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { TrendPoint } from '../../services/profileHistoryService';
import { colors } from '../../theme';

type BarTrendChartProps = {
  points: TrendPoint[];
  formatValue: (value: number) => string;
};

const CHART_HEIGHT = 180;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 20;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const BAR_GAP_RATIO = 0.35;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function BarTrendChart({ points, formatValue }: BarTrendChartProps) {
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(width - PADDING_LEFT - PADDING_RIGHT, 1);

  const { bars, yLabels } = useMemo(() => {
    if (points.length === 0 || width <= 0) {
      return { bars: [] as { x: number; y: number; width: number; height: number; isLast: boolean }[], yLabels: [] as string[] };
    }

    const maxValue = niceMax(Math.max(...points.map((point) => point.value)));
    const slotWidth = plotWidth / points.length;
    const barWidth = slotWidth * (1 - BAR_GAP_RATIO);

    const computedBars = points.map((point, index) => {
      const normalized = maxValue > 0 ? point.value / maxValue : 0;
      const barHeight = normalized * PLOT_HEIGHT;
      return {
        x: PADDING_LEFT + slotWidth * index + (slotWidth - barWidth) / 2,
        y: PADDING_TOP + (PLOT_HEIGHT - barHeight),
        width: barWidth,
        height: Math.max(barHeight, 1),
        isLast: index === points.length - 1,
      };
    });

    return {
      bars: computedBars,
      yLabels: [formatValue(maxValue), formatValue(maxValue / 2), formatValue(0)],
    };
  }, [formatValue, plotWidth, points, width]);

  // Thin x-axis labels when there are too many bars to fit readably.
  const labelStride = points.length > 12 ? Math.ceil(points.length / 8) : 1;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.container}>
      <View style={styles.yAxis}>
        {yLabels.map((label, index) => (
          <Text key={`${index}-${label}`} style={styles.yLabel}>
            {label}
          </Text>
        ))}
      </View>

      {width > 0 ? (
        <Svg height={CHART_HEIGHT} width={width}>
          {bars.map((bar, index) => (
            <Rect
              fill={colors.accentLime}
              fillOpacity={bar.isLast ? 1 : 0.55}
              height={bar.height}
              key={index}
              rx={3}
              width={bar.width}
              x={bar.x}
              y={bar.y}
            />
          ))}
        </Svg>
      ) : null}

      <View style={styles.xAxis}>
        {points.map((point, index) => {
          if (index % labelStride !== 0 && index !== points.length - 1) return null;
          const slotWidth = plotWidth / points.length;
          return (
            <Text
              key={point.bucketStart}
              numberOfLines={1}
              style={[styles.xLabel, { left: slotWidth * index, width: slotWidth }]}
            >
              {point.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: CHART_HEIGHT + 20,
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: PADDING_TOP,
    height: PLOT_HEIGHT,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  yLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  xAxis: {
    position: 'relative',
    height: 16,
    marginLeft: PADDING_LEFT,
  },
  xLabel: {
    position: 'absolute',
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});
