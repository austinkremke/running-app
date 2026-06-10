import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type RunStartButtonProps = {
  onPress?: () => void;
};

export function RunStartButton({ onPress }: RunStartButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start run"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons color={colors.background} name="walk" size={20} />
      <Text style={styles.label}>START RUN</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8E628',
    paddingVertical: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});
