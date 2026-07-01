import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type FriendsFindBarProps = {
  onPress: () => void;
};

export function FriendsFindBar({ onPress }: FriendsFindBarProps) {
  return (
    <Pressable
      accessibilityLabel="Find friends"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
    >
      <Ionicons color={colors.textSecondary} name="search" size={16} />
      <Text style={styles.placeholder}>Search runners by name</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  placeholder: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
});
