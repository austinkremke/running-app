import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RunnerIcon } from '../../icons';
import { colors, spacing } from '../../../theme';

type SoloActiveMatchActionsProps = {
  onMessage?: () => void;
  onRun?: () => void;
};

export function SoloActiveMatchActions({ onMessage, onRun }: SoloActiveMatchActionsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Message opponent"
        accessibilityRole="button"
        onPress={onMessage}
        style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && styles.pressed]}
      >
        <Ionicons color={colors.textPrimary} name="chatbubble-outline" size={16} />
        <Text style={styles.buttonLabel}>Message</Text>
      </Pressable>

      <Pressable
        accessibilityLabel="Start run"
        accessibilityRole="button"
        onPress={onRun}
        style={({ pressed }) => [styles.button, styles.buttonRun, pressed && styles.pressed]}
      >
        <RunnerIcon color={colors.background} size={16} />
        <Text style={[styles.buttonLabel, styles.buttonLabelRun]}>Run</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
  },
  buttonRun: {
    backgroundColor: colors.accentLime,
    borderColor: colors.accentLime,
  },
  buttonLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonLabelRun: {
    color: colors.background,
  },
  pressed: {
    opacity: 0.85,
  },
});
