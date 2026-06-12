import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../theme';

type PostRunTestButtonProps = {
  onPress: () => void;
};

export function PostRunTestButton({ onPress }: PostRunTestButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Preview post-run summary"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>Preview Post-Run</Text>
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
    borderColor: 'rgba(215, 255, 47, 0.35)',
    backgroundColor: 'rgba(215, 255, 47, 0.08)',
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '700',
  },
});
