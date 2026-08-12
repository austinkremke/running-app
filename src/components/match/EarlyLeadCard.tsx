import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

/** Shown in place of the activity feed while an active match is still 0–0. */
export function EarlyLeadCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>No match runs yet.</Text>
      <Text style={styles.message}>Complete a run to take an early lead!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  eyebrow: {
    color: colors.accentLime,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  message: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
