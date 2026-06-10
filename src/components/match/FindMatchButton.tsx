import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

export function FindMatchButton() {
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Find match"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons color={colors.background} name="footsteps" size={18} />
        <View style={styles.textBlock}>
          <Text style={styles.label}>Find Match</Text>
          <Text style={styles.subtext}>We'll find a team of similar skill</Text>
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
  subtext: {
    color: colors.background,
    fontSize: 10,
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.9,
  },
});
