import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type TeamJoinPromptProps = {
  joining?: boolean;
  onJoin: () => void;
};

export function TeamJoinPrompt({ joining = false, onJoin }: TeamJoinPromptProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a team</Text>
      <Text style={styles.body}>
        Team runs, chat, and feed posts show up here once you join a squad.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Join Road Warriors"
        disabled={joining}
        onPress={onJoin}
        style={({ pressed }) => [styles.button, (pressed || joining) && styles.pressed]}
      >
        {joining ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonLabel}>JOIN ROAD WARRIORS</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.sm,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});
