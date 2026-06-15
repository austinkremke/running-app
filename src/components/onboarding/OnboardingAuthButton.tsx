import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type OnboardingAuthButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'outline' | 'primary';
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
};

export function OnboardingAuthButton({
  label,
  onPress,
  variant = 'outline',
  icon,
  iconColor,
}: OnboardingAuthButtonProps) {
  const isPrimary = variant === 'primary';
  const resolvedIconColor = iconColor ?? (isPrimary ? colors.background : colors.textPrimary);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonOutline,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <View style={styles.iconSlot}>
          <Ionicons color={resolvedIconColor} name={icon} size={20} />
        </View>
      ) : null}
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelOutline]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.accentLime,
  },
  buttonPrimary: {
    backgroundColor: colors.accentLime,
    borderColor: colors.accentLime,
  },
  pressed: {
    opacity: 0.85,
  },
  iconSlot: {
    width: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  labelOutline: {
    color: colors.textPrimary,
  },
  labelPrimary: {
    color: colors.background,
  },
});
