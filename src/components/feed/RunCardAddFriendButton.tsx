import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type RunCardAddFriendButtonProps = {
  disabled?: boolean;
  /** A request is already outstanding — shows "Pending" and blocks another tap. */
  pending?: boolean;
  onPress: () => void;
};

export function RunCardAddFriendButton({
  disabled = false,
  pending = false,
  onPress,
}: RunCardAddFriendButtonProps) {
  const isDisabled = disabled || pending;

  return (
    <Pressable
      accessibilityLabel={pending ? 'Friend request pending' : 'Add friend'}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
        {pending ? 'Pending' : 'Add Friend'}
      </Text>
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
