import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';
import {
  RANK_BORDER_AVATAR_DIAMETER_RATIO,
  rankBorderSourceForTier,
} from './rankAvatarBorderTheme';

type RankBorderAvatarProps = {
  avatarUrl?: string;
  size: number;
  rankTierId?: string | null;
};

export function RankBorderAvatar({ avatarUrl, size, rankTierId }: RankBorderAvatarProps) {
  const borderSource = rankBorderSourceForTier(rankTierId);
  const avatarDiameter = Math.round(size * RANK_BORDER_AVATAR_DIAMETER_RATIO);
  const avatarOffset = (size - avatarDiameter) / 2;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <View
        style={[
          styles.avatarClip,
          {
            width: avatarDiameter,
            height: avatarDiameter,
            borderRadius: avatarDiameter / 2,
            left: avatarOffset,
            top: avatarOffset,
          },
        ]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
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
