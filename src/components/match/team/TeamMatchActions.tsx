import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RunnerIcon } from '../../icons';
import { colors, spacing } from '../../../theme';

type TeamMatchActionsProps = {
  onTeamChat?: () => void;
  onRun?: () => void;
};

export function TeamMatchActions({ onTeamChat, onRun }: TeamMatchActionsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Team chat"
        accessibilityRole="button"
        onPress={onTeamChat}
        style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && styles.pressed]}
      >
        <Ionicons color={colors.textPrimary} name="chatbubble-outline" size={16} />
        <Text style={styles.buttonLabel}>Team Chat</Text>
      </Pressable>

      <Pressable
        accessibilityLabel="Run"
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
    borderColor: '#B8E628',
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
