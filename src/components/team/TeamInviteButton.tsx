import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type TeamInviteButtonProps = {
  onPress?: () => void;
};

export function TeamInviteButton({ onPress }: TeamInviteButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Invite member"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons color={colors.background} name="person-add" size={12} />
      <Text style={styles.label}>Invite</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentLime,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
  },
});
