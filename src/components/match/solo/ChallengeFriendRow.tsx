import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChallengeFriend } from '../../../mock';
import { colors, spacing } from '../../../theme';

type ChallengeFriendRowProps = {
  friend: ChallengeFriend;
  selected?: boolean;
  onPress: () => void;
  showDivider?: boolean;
};

const AVATAR_SIZE = 40;

export function ChallengeFriendRow({
  friend,
  selected = false,
  onPress,
  showDivider = true,
}: ChallengeFriendRowProps) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarRing, friend.isOnline && styles.avatarRingOnline]}>
            {friend.avatarUrl ? (
              <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>
        </View>

        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.name}>
            {friend.name}
          </Text>
          <Text style={styles.level}>Level {friend.level}</Text>
        </View>

        <View style={[styles.selector, selected && styles.selectorSelected]}>
          {selected ? (
            <Ionicons color={colors.background} name="checkmark" size={12} />
          ) : null}
        </View>
      </Pressable>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarRingOnline: {
    borderColor: colors.accentLime,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  level: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  selector: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorSelected: {
    borderColor: colors.accentLime,
    backgroundColor: colors.accentLime,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
});
