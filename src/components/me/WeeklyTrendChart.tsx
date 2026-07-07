import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { WeeklyPoint } from '../../services/profileHistoryService';
import { colors } from '../../theme';

type WeeklyTrendChartProps = {
  points: WeeklyPoint[];
  formatValue: (value: number) => string;
};

const CHART_HEIGHT = 180;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 20;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function WeeklyTrendChart({ points, formatValue }: WeeklyTrendChartProps) {
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(width - PADDING_LEFT - PADDING_RIGHT, 1);

  const { linePath, areaPath, dots, yLabels } = useMemo(() => {
    if (points.length === 0 || width <= 0) {
      return { linePath: '', areaPath: '', dots: [] as { x: number; y: number }[], yLabels: [] as string[] };
    }

    const maxValue = niceMax(Math.max(...points.map((point) => point.value)));
    const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

    const coords = points.map((point, index) => {
      const x = PADDING_LEFT + step * index;
      const normalized = maxValue > 0 ? point.value / maxValue : 0;
      const y = PADDING_TOP + (1 - normalized) * PLOT_HEIGHT;
      return { x, y };
    });

    const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = `${line} L ${coords[coords.length - 1].x} ${PADDING_TOP + PLOT_HEIGHT} L ${coords[0].x} ${
      PADDING_TOP + PLOT_HEIGHT
    } Z`;

    return {
      linePath: line,
      areaPath: area,
      dots: coords,
      yLabels: [formatValue(maxValue), formatValue(maxValue / 2), formatValue(0)],
    };
  }, [formatValue, plotWidth, points, width]);

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
          <Defs>
            <LinearGradient id="weeklyTrendFill" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0%" stopColor={colors.accentLime} stopOpacity={0.32} />
              <Stop offset="100%" stopColor={colors.accentLime} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {areaPath ? <Path d={areaPath} fill="url(#weeklyTrendFill)" /> : null}
          {linePath ? <Path d={linePath} fill="none" stroke={colors.accentLime} strokeWidth={2} /> : null}

          {dots.map((dot, index) => {
            const isLast = index === dots.length - 1;
            return (
              <Circle
                cx={dot.x}
                cy={dot.y}
                fill={isLast ? colors.accentLime : colors.background}
                key={index}
                r={isLast ? 5 : 3}
                stroke={colors.accentLime}
                strokeWidth={isLast ? 0 : 1.5}
              />
            );
          })}
        </Svg>
      ) : null}

      <View style={styles.xAxis}>
        {points.map((point, index) => (
          <Text
            key={point.weekStart}
            style={[
              styles.xLabel,
              { left: (plotWidth / Math.max(points.length - 1, 1)) * index },
            ]}
          >
            {point.monthLabel}
          </Text>
        ))}
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
    fontSize: 10,
    fontWeight: '600',
    transform: [{ translateX: -8 }],
  },
});
