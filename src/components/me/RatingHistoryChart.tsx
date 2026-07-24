import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

import type { SoloRatingHistoryEntry } from '../../services/rank';
import { colors } from '../../theme';

type RatingHistoryChartProps = {
  /** Ascending chronological (oldest first). */
  entries: SoloRatingHistoryEntry[];
  selectedMatchId: string | null;
  onSelectPoint: (matchId: string) => void;
};

const CHART_HEIGHT = 190;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 22;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const POINT_RADIUS = 4;
const POINT_RADIUS_LATEST = 6;
const POINT_RADIUS_SELECTED = 7;
const HIT_RADIUS = 16;

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RatingHistoryChart({ entries, selectedMatchId, onSelectPoint }: RatingHistoryChartProps) {
  const [width, setWidth] = useState(0);

  const { linePath, areaPath, points, yLabels } = useMemo(() => {
    if (entries.length === 0 || width <= 0) {
      return {
        linePath: '',
        areaPath: '',
        points: [] as { x: number; y: number; matchId: string; ratingAfter: number; endedAt: string }[],
        yLabels: [] as string[],
      };
    }

    const plotWidth = Math.max(width - PADDING_LEFT - PADDING_RIGHT, 1);

    const times = entries.map((entry) => new Date(entry.endedAt).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = Math.max(maxTime - minTime, 1);

    const values = entries.map((entry) => entry.ratingAfter);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = Math.max(maxValue - minValue, 1);

    const computed = entries.map((entry, index) => {
      const x =
        entries.length === 1
          ? PADDING_LEFT + plotWidth / 2
          : PADDING_LEFT + ((times[index] - minTime) / timeRange) * plotWidth;
      // Higher rating at the top — same convention as the All-Time Bests chart.
      const normalized = (entry.ratingAfter - minValue) / valueRange;
      const y = PADDING_TOP + (1 - normalized) * PLOT_HEIGHT;
      return { x, y, matchId: entry.matchId, ratingAfter: entry.ratingAfter, endedAt: entry.endedAt };
    });

    const line = computed.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = `${line} L ${computed[computed.length - 1]?.x ?? PADDING_LEFT} ${
      PADDING_TOP + PLOT_HEIGHT
    } L ${computed[0]?.x ?? PADDING_LEFT} ${PADDING_TOP + PLOT_HEIGHT} Z`;

    return {
      linePath: line,
      areaPath: area,
      points: computed,
      yLabels: [
        Math.round(maxValue).toLocaleString(),
        Math.round((maxValue + minValue) / 2).toLocaleString(),
        Math.round(minValue).toLocaleString(),
      ],
    };
  }, [entries, width]);

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
            <LinearGradient id="ratingHistoryFill" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0%" stopColor={colors.accentLime} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={colors.accentLime} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {areaPath ? <Path d={areaPath} fill="url(#ratingHistoryFill)" /> : null}
          {linePath ? <Path d={linePath} fill="none" stroke={colors.accentLime} strokeWidth={2} /> : null}

          {points.map((point, index) => {
            const isSelected = point.matchId === selectedMatchId;
            const isLatest = index === points.length - 1;
            return (
              <G key={point.matchId}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  fill="transparent"
                  onPress={() => onSelectPoint(point.matchId)}
                  r={HIT_RADIUS}
                />
                <Circle
                  cx={point.x}
                  cy={point.y}
                  fill={isSelected || isLatest ? colors.accentLime : colors.background}
                  onPress={() => onSelectPoint(point.matchId)}
                  r={isSelected ? POINT_RADIUS_SELECTED : isLatest ? POINT_RADIUS_LATEST : POINT_RADIUS}
                  stroke={colors.accentLime}
                  strokeWidth={2}
                />
              </G>
            );
          })}
        </Svg>
      ) : null}

      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>{points[0] ? formatDateShort(points[0].endedAt) : ''}</Text>
        <Text style={[styles.xLabel, styles.xLabelLatest]}>
          {points[points.length - 1] ? formatDateShort(points[points.length - 1].endedAt) : ''}
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
