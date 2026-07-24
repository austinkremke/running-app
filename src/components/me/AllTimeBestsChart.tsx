import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

import type { AllTimeBest } from '../../services/distanceRecords';
import { formatDurationClock } from '../../services/distanceService';
import { colors } from '../../theme';

type AllTimeBestsChartProps = {
  /** Ascending chronological (oldest first). */
  bests: AllTimeBest[];
  selectedActivityId: string | null;
  onSelectPoint: (activityId: string) => void;
};

const CHART_HEIGHT = 190;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 12;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 22;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const POINT_RADIUS = 4;
const POINT_RADIUS_LATEST = 6;
const POINT_RADIUS_SELECTED = 7;
const HIT_RADIUS = 16;

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AllTimeBestsChart({ bests, selectedActivityId, onSelectPoint }: AllTimeBestsChartProps) {
  const [width, setWidth] = useState(0);

  const { linePath, areaPath, points, yLabels } = useMemo(() => {
    if (bests.length === 0 || width <= 0) {
      return {
        linePath: '',
        areaPath: '',
        points: [] as { x: number; y: number; activityId: string; splitSeconds: number; achievedAt: string }[],
        yLabels: [] as string[],
      };
    }

    const plotWidth = Math.max(width - PADDING_LEFT - PADDING_RIGHT, 1);

    const times = bests.map((best) => new Date(best.achievedAt).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = Math.max(maxTime - minTime, 1);

    const values = bests.map((best) => best.splitSeconds);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = Math.max(maxValue - minValue, 1);

    const computed = bests.map((best, index) => {
      const x =
        bests.length === 1
          ? PADDING_LEFT + plotWidth / 2
          : PADDING_LEFT + ((times[index] - minTime) / timeRange) * plotWidth;
      // Standard axis: max value at the top, min at the bottom (matches the
      // y-axis labels below), so a run getting faster over time slopes down-right.
      const normalized = (best.splitSeconds - minValue) / valueRange;
      const y = PADDING_TOP + (1 - normalized) * PLOT_HEIGHT;
      return { x, y, activityId: best.activityId, splitSeconds: best.splitSeconds, achievedAt: best.achievedAt };
    });

    const line = computed.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = `${line} L ${computed[computed.length - 1]?.x ?? PADDING_LEFT} ${
      PADDING_TOP + PLOT_HEIGHT
    } L ${computed[0]?.x ?? PADDING_LEFT} ${PADDING_TOP + PLOT_HEIGHT} Z`;

    return {
      linePath: line,
      areaPath: area,
      points: computed,
      yLabels: [formatDurationClock(maxValue), formatDurationClock((maxValue + minValue) / 2), formatDurationClock(minValue)],
    };
  }, [bests, width]);

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
            <LinearGradient id="allTimeBestsFill" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0%" stopColor={colors.accentLime} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={colors.accentLime} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {areaPath ? <Path d={areaPath} fill="url(#allTimeBestsFill)" /> : null}
          {linePath ? <Path d={linePath} fill="none" stroke={colors.accentLime} strokeWidth={2} /> : null}

          {points.map((point, index) => {
            const isSelected = point.activityId === selectedActivityId;
            const isLatest = index === points.length - 1;
            return (
              <G key={point.activityId}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  fill="transparent"
                  onPress={() => onSelectPoint(point.activityId)}
                  r={HIT_RADIUS}
                />
                <Circle
                  cx={point.x}
                  cy={point.y}
                  fill={isSelected || isLatest ? colors.accentLime : colors.background}
                  onPress={() => onSelectPoint(point.activityId)}
                  r={isSelected ? POINT_RADIUS_SELECTED : isLatest ? POINT_RADIUS_LATEST : POINT_RADIUS}
                  stroke={colors.accentLime}
                  strokeWidth={2}
                />
              </G>
            );
          })}
        </Svg>
      ) : null}

      {points.map((point, index) => {
        const isLatest = index === points.length - 1;
        return (
          <Text
            key={point.activityId}
            style={[
              styles.pointLabel,
              { left: point.x - 22, top: point.y - 22 },
              isLatest && styles.pointLabelLatest,
            ]}
          >
            {formatDurationClock(point.splitSeconds)}
          </Text>
        );
      })}

      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>{points[0] ? formatDateShort(points[0].achievedAt) : ''}</Text>
        <Text style={[styles.xLabel, styles.xLabelLatest]}>
          {points[points.length - 1] ? formatDateShort(points[points.length - 1].achievedAt) : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CHART_HEIGHT + 20,
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
    fontSize: 9,
    fontWeight: '600',
  },
  pointLabel: {
    position: 'absolute',
    width: 44,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  pointLabelLatest: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
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
    fontSize: 10,
    fontWeight: '600',
  },
  xLabelLatest: {
    color: colors.accentLime,
    fontWeight: '800',
  },
});
