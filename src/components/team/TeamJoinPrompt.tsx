import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type TeamJoinPromptProps = {
  joining?: boolean;
  onJoin: () => void;
  onCreate?: () => void;
  /** Level-gate CTA, e.g. "Reach level 10" — locks the create button when set. */
  createLockedLabel?: string | null;
};

export function TeamJoinPrompt({
  joining = false,
  onJoin,
  onCreate,
  createLockedLabel = null,
}: TeamJoinPromptProps) {
  const createLocked = Boolean(createLockedLabel);

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

      {onCreate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a team"
          accessibilityState={{ disabled: createLocked || joining }}
          disabled={createLocked || joining}
          onPress={onCreate}
          style={({ pressed }) => [
            styles.createButton,
            createLocked && styles.createButtonLocked,
            pressed && !createLocked ? styles.pressed : null,
          ]}
        >
          {createLocked ? (
            <View style={styles.createLockedRow}>
              <Ionicons color={colors.textSecondary} name="lock-closed" size={14} />
              <Text style={styles.createLockedLabel}>
                {createLockedLabel} to create a team
              </Text>
            </View>
          ) : (
            <Text style={styles.createLabel}>CREATE A TEAM</Text>
          )}
        </Pressable>
      ) : null}
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
  buttonLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  createButton: {
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accentLime,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  createButtonLocked: {
    borderColor: colors.border,
  },
  createLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  createLockedLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  createLabel: {
    color: colors.accentLime,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
