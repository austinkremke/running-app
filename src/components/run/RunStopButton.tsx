import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type RunStopButtonProps = {
  onPress?: () => void;
};

export function RunStopButton({ onPress }: RunStopButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Stop run"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>STOP RUN</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentLime,
    paddingVertical: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.accentLime,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});
