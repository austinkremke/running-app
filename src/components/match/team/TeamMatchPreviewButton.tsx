import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../../theme';

type TeamMatchPreviewButtonProps = {
  onPress?: () => void;
};

export function TeamMatchPreviewButton({ onPress }: TeamMatchPreviewButtonProps) {
  return (
    <Pressable
      accessibilityLabel="View active team match"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>View Active Match</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(155, 92, 255, 0.4)',
    backgroundColor: 'rgba(155, 92, 255, 0.08)',
  },
  label: {
    color: colors.accentPurple,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
  },
});
