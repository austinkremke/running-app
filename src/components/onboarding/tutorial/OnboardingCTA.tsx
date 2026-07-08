import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../theme';
import { OnboardingPrimaryButton } from '../OnboardingPrimaryButton';

type OnboardingCTAProps = {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
};

export function OnboardingCTA({
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
}: OnboardingCTAProps) {
  return (
    <View style={styles.container}>
      <OnboardingPrimaryButton label={primaryLabel} onPress={onPrimaryPress} />
      <Pressable
        accessibilityRole="button"
        onPress={onSecondaryPress}
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  secondaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
