import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../theme';

type AvatarProps = {
  avatarUrl?: string;
  /** Fixed diameter in px. Ignored when `stretch` is true. */
  size?: number;
  /** Grow to match sibling height while staying circular. */
  stretch?: boolean;
  borderColor?: string;
  borderWidth?: number;
  showLevel?: boolean;
  level?: number;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_SIZE = 36;

export function Avatar({
  avatarUrl,
  size = DEFAULT_SIZE,
  stretch = false,
  borderColor = colors.border,
  borderWidth = 2,
  showLevel = false,
  level,
  style,
}: AvatarProps) {
  const dimensionStyle = stretch ? styles.stretch : { width: size, height: size };

  return (
    <View style={[styles.wrapper, dimensionStyle, style]}>
      <View
        style={[
          styles.ring,
          stretch ? styles.ringStretch : styles.ringFixed,
          { borderColor, borderWidth, padding: borderWidth <= 1 ? 1 : 2 },
        ]}
      >
        <View style={styles.inner}>
          {avatarUrl ? (
            <Image resizeMode="cover" source={{ uri: avatarUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
        </View>
      </View>

      {showLevel && level != null ? (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  stretch: {
    alignSelf: 'stretch',
    aspectRatio: 1,
    borderRadius: 9999,
  },
  ring: {
    borderRadius: 9999,
  },
  ringStretch: {
    flex: 1,
  },
  ringFixed: {
    width: '100%',
    height: '100%',
  },
  inner: {
    flex: 1,
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.surfaceElevated,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelText: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
});
