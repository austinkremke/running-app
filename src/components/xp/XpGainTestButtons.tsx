import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type XpGainTestButtonsProps = {
  onTestNormal: () => void;
  onTestLevelUp: () => void;
};

export function XpGainTestButtons({ onTestNormal, onTestLevelUp }: XpGainTestButtonsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>XP Animation (dev)</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Test normal XP gain"
          onPress={onTestNormal}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonLabel}>+420 XP</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Test level up XP gain"
          onPress={onTestLevelUp}
          style={({ pressed }) => [styles.button, styles.buttonAccent, pressed && styles.pressed]}
        >
          <Text style={[styles.buttonLabel, styles.buttonLabelAccent]}>Level Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  buttonAccent: {
    borderColor: 'rgba(227, 255, 106, 0.4)',
    backgroundColor: 'rgba(227, 255, 106, 0.08)',
  },
  buttonLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  buttonLabelAccent: {
    color: colors.accentLime,
  },
  pressed: {
    opacity: 0.85,
  },
});
