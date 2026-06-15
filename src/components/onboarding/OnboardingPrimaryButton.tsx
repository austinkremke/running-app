import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type OnboardingPrimaryButtonProps = {
  label: string;
  onPress?: () => void;
};

export function OnboardingPrimaryButton({ label, onPress }: OnboardingPrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentLime,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
});
