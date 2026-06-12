import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { TeamLogoAccent } from '../../mock';
import { colors } from '../../theme';
import { getTeamLogoAccentColor } from './teamLogoTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const SHIELD_VIEWBOX = { width: 56, height: 64 };

const SHIELD_PATH =
  'M28 3 L50 7 L50 28 C50 42 40 54 28 61 C16 54 6 42 6 28 L6 7 Z';

type TeamLogoProps = {
  icon: IoniconsName;
  accent?: TeamLogoAccent;
  size?: number;
  height?: number;
  filled?: boolean;
  stretch?: boolean;
};

export function TeamLogo({
  icon,
  accent = 'lime',
  size = 52,
  height,
  filled = false,
  stretch = false,
}: TeamLogoProps) {
  const borderColor = getTeamLogoAccentColor(accent);
  const shieldHeight = height ?? size * (SHIELD_VIEWBOX.height / SHIELD_VIEWBOX.width);
  const shieldWidth = height
    ? height * (SHIELD_VIEWBOX.width / SHIELD_VIEWBOX.height)
    : size;
  const iconSize = shieldWidth * 0.38;

  return (
    <View
      style={[
        styles.wrapper,
        stretch
          ? { width: shieldWidth, alignSelf: 'stretch' }
          : { width: shieldWidth, height: shieldHeight },
      ]}
    >
      <Svg
        height="100%"
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${SHIELD_VIEWBOX.width} ${SHIELD_VIEWBOX.height}`}
        width="100%"
      >
        <Path
          d={SHIELD_PATH}
          fill={filled ? colors.background : 'transparent'}
          stroke={borderColor}
          strokeLinejoin="round"
          strokeWidth={1}
        />
      </Svg>

      <View style={styles.icon}>
        <Ionicons color={borderColor} name={icon} size={iconSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexShrink: 0,
    position: 'relative',
  },
  icon: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
});
