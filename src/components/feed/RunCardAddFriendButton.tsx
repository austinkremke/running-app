import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type RunCardAddFriendButtonProps = {
  disabled?: boolean;
  onPress: () => void;
};

export function RunCardAddFriendButton({ disabled = false, onPress }: RunCardAddFriendButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Follow"
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>Follow</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accentLime,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  buttonDisabled: {
    borderColor: colors.border,
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
});
