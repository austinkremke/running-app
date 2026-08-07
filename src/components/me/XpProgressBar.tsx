import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../../theme';

type XpProgressBarProps = {
  progress: number;
  height?: number;
  /** Solid fill color instead of the default lime gradient. */
  fillColor?: string;
  /** Thin border around the track — useful when the fill/track barely contrast with the surrounding background. */
  trackBorderColor?: string;
};

const FILL_LEAD = '#E3FF6A';

export function XpProgressBar({ progress, height = 10, fillColor, trackBorderColor }: XpProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = height / 2;
  const gradientId = 'xpFill';

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: radius },
        trackBorderColor ? { borderWidth: StyleSheet.hairlineWidth, borderColor: trackBorderColor } : null,
      ]}
    >
      <View style={[styles.fillClip, { width: `${clampedProgress * 100}%` }]}>
        {fillColor ? (
          <View style={[styles.fillSvg, { backgroundColor: fillColor }]} />
        ) : (
          <Svg
            height="100%"
            preserveAspectRatio="none"
            style={styles.fillSvg}
            viewBox={`0 0 100 ${height}`}
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <Stop offset="0" stopColor={colors.accentLime} />
                <Stop offset="1" stopColor={FILL_LEAD} />
              </LinearGradient>
            </Defs>
            <Rect fill={`url(#${gradientId})`} height={height} width="100" />
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fillClip: {
    height: '100%',
    overflow: 'hidden',
  },
  fillSvg: {
    width: '100%',
    height: '100%',
  },
});
