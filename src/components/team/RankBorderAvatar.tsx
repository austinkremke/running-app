import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';
import {
  rankBorderAvatarLayout,
  rankBorderSourceForTier,
} from './rankAvatarBorderTheme';

type RankBorderAvatarProps = {
  avatarUrl?: string;
  size: number;
  rankTierId?: string | null;
  /** Rendered instead of the plain placeholder when there's no avatarUrl (e.g. a team icon badge). */
  fallback?: ReactNode;
};

export function RankBorderAvatar({ avatarUrl, size, rankTierId, fallback }: RankBorderAvatarProps) {
  const borderSource = rankBorderSourceForTier(rankTierId);
  const { avatarDiameter, avatarLeft, avatarTop } = rankBorderAvatarLayout(size, rankTierId);

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

      {borderSource ? (
        <Image
          accessibilityIgnoresInvertColors
          pointerEvents="none"
          resizeMode="contain"
          source={borderSource}
          style={styles.borderOverlay}
        />
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
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
