import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { colors } from '../../theme';

type UserLevelBadgeProps = {
  level: number;
};

const BADGE_WIDTH = 24;
const BADGE_HEIGHT = 20;

function getHexagonPoints(width: number, height: number, inset = 0): string {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2 - inset;
  const ry = height / 2 - inset;

  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
}

export function UserLevelBadge({ level }: UserLevelBadgeProps) {
  return (
    <View style={styles.wrapper}>
      <Svg height={BADGE_HEIGHT} viewBox={`0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}`} width={BADGE_WIDTH}>
        <Polygon
          fill={colors.surface}
          points={getHexagonPoints(BADGE_WIDTH, BADGE_HEIGHT, 0.5)}
          stroke={colors.accentLime}
          strokeWidth={1.5}
        />
      </Svg>
      <Text style={styles.text}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: BADGE_WIDTH,
    height: BADGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    position: 'absolute',
    color: colors.accentLime,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
