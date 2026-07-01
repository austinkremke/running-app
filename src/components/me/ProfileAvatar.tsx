import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';
import { RankBorderAvatar } from '../team/RankBorderAvatar';
import { rankBorderSourceForTier } from '../team/rankAvatarBorderTheme';

type ProfileAvatarProps = {
  avatarUrl?: string;
  onEditPress?: () => void;
  rankBorderTierId?: string | null;
  size?: number;
};

const DEFAULT_SIZE = 72;

export function ProfileAvatar({
  avatarUrl,
  onEditPress,
  rankBorderTierId,
  size = DEFAULT_SIZE,
}: ProfileAvatarProps) {
  const editSize = size * 0.28;
  const hasRankBorder = rankBorderSourceForTier(rankBorderTierId) != null;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {hasRankBorder ? (
        <RankBorderAvatar avatarUrl={avatarUrl} rankTierId={rankBorderTierId} size={size} />
      ) : (
        <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={styles.inner}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholder]} />
            )}
          </View>
        </View>
      )}

      <Pressable
        accessibilityLabel="Edit profile photo"
        accessibilityRole="button"
        hitSlop={6}
        onPress={onEditPress}
        style={[
          styles.editButton,
          {
            width: editSize,
            height: editSize,
            borderRadius: editSize / 2,
            right: -2,
            bottom: -2,
          },
        ]}
      >
        <Ionicons color={colors.textPrimary} name="pencil" size={editSize * 0.45} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  ring: {
    borderWidth: 3,
    borderColor: colors.accentLime,
    padding: 2,
  },
  inner: {
    flex: 1,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.surfaceElevated,
  },
  editButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
  },
});
