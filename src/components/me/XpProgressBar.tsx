import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../../theme';

type XpProgressBarProps = {
  progress: number;
};

const FILL_LEAD = '#E3FF6A';

export function XpProgressBar({ progress }: XpProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.track}>
      <View style={[styles.fillClip, { width: `${clampedProgress * 100}%` }]}>
        <Svg height="100%" preserveAspectRatio="none" style={styles.fillSvg} viewBox="0 0 100 10">
          <Defs>
            <LinearGradient id="xpFill" x1="0" x2="1" y1="0" y2="0">
              <Stop offset="0" stopColor={colors.accentLime} />
              <Stop offset="1" stopColor={FILL_LEAD} />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#xpFill)" height="10" rx="5" width="100" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fillClip: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fillSvg: {
    width: '100%',
    height: '100%',
  },
});
