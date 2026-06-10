import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout } from '../../theme';

type ProfileAvatarButtonProps = {
  imageUri?: string;
  initials?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function ProfileAvatarButton({
  imageUri,
  initials = 'U',
  onPress,
  accessibilityLabel = 'Open profile',
}: ProfileAvatarButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      hitSlop={8}
    >
      <View style={styles.ring}>
        {imageUri ? (
          <Image accessibilityIgnoresInvertColors source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const size = layout.avatarSize;

const styles = StyleSheet.create({
  wrapper: {
    width: layout.iconButtonSize,
    height: layout.iconButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  ring: {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1.5,
    borderColor: colors.accentLime,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
