import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '../../theme';
import {
  rankBorderAvatarLayout,
  rankBorderGradientStopsForTier,
} from './rankAvatarBorderTheme';

type RankBorderAvatarProps = {
  avatarUrl?: string;
  size: number;
  rankTierId?: string | null;
  /** Rendered instead of the plain placeholder when there's no avatarUrl (e.g. a team icon badge). */
  fallback?: ReactNode;
};

export function RankBorderAvatar({ avatarUrl, size, rankTierId, fallback }: RankBorderAvatarProps) {
  const gradientStops = rankBorderGradientStopsForTier(rankTierId);
  const { avatarDiameter, avatarLeft, avatarTop, ringWidth } = rankBorderAvatarLayout(size, rankTierId);
  const gradientId = `rank-border-${rankTierId ?? 'none'}-${size}`;
  const ringRadius = (size - ringWidth) / 2;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <View
        style={[
          styles.avatarClip,
          {
            width: avatarDiameter,
            height: avatarDiameter,
            borderRadius: avatarDiameter / 2,
            left: avatarLeft,
            top: avatarTop,
          },
        ]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : fallback ? (
          fallback
        ) : (
          <View style={[styles.avatarImage, styles.avatarPlaceholder]} />
        )}
      </View>

      {gradientStops ? (
        <Svg height={size} pointerEvents="none" style={styles.borderOverlay} width={size}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
              {gradientStops.map((stop) => (
                <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            fill="none"
            r={ringRadius}
            stroke={`url(#${gradientId})`}
            strokeWidth={ringWidth}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
    overflow: 'visible',
  },
  avatarClip: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
