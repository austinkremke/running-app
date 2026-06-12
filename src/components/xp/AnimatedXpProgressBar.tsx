import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../../theme';

type AnimatedXpProgressBarProps = {
  progress: Animated.Value;
  height?: number;
};

const FILL_LEAD = '#E3FF6A';

export function AnimatedXpProgressBar({ progress, height = 12 }: AnimatedXpProgressBarProps) {
  const radius = height / 2;
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { height, borderRadius: radius }]}>
      <Animated.View style={[styles.fillClip, { width }]}>
        <Svg
          height="100%"
          preserveAspectRatio="none"
          style={styles.fillSvg}
          viewBox={`0 0 100 ${height}`}
        >
          <Defs>
            <LinearGradient id="xpFillAnimated" x1="0" x2="1" y1="0" y2="0">
              <Stop offset="0" stopColor={colors.accentLime} />
              <Stop offset="1" stopColor={FILL_LEAD} />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#xpFillAnimated)" height={height} width="100" />
        </Svg>
      </Animated.View>
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
