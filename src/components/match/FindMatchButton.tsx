import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type FindMatchButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function FindMatchButton({ onPress, disabled = false }: FindMatchButtonProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Find match"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
          pressed && !disabled ? styles.pressed : null,
        ]}
      >
        <Ionicons
          color={disabled ? colors.textSecondary : colors.background}
          name="footsteps"
          size={18}
        />
        <View style={styles.textBlock}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>Find Match</Text>
          <Text style={[styles.subtext, disabled && styles.subtextDisabled]}>
            {disabled ? 'Searching for an opponent team' : "We'll find a team of similar skill"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLime,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceElevated,
    opacity: 0.7,
  },
  textBlock: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  subtext: {
    color: colors.background,
    fontSize: 10,
    opacity: 0.8,
  },
  subtextDisabled: {
    color: colors.textSecondary,
    opacity: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
