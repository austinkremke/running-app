import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type TeamManageSectionProps = {
  /** Viewer's role on the team; undefined = plain member. */
  role?: 'leader' | 'co-leader';
  onEditTeam?: () => void;
  onLeaveTeam: () => void;
  onDisbandTeam?: () => void;
};

export function TeamManageSection({
  role,
  onEditTeam,
  onLeaveTeam,
  onDisbandTeam,
}: TeamManageSectionProps) {
  const canEdit = role === 'leader' || role === 'co-leader';
  const isLeader = role === 'leader';

  return (
    <View style={styles.container}>
      {canEdit && onEditTeam ? (
        <Pressable
          accessibilityLabel="Edit team"
          accessibilityRole="button"
          onPress={onEditTeam}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Ionicons color={colors.textSecondary} name="create-outline" size={16} />
          <Text style={styles.label}>Edit Team</Text>
        </Pressable>
      ) : null}

      {isLeader && onDisbandTeam ? (
        <Pressable
          accessibilityLabel="Disband team"
          accessibilityRole="button"
          onPress={onDisbandTeam}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Ionicons color={colors.danger} name="trash-outline" size={16} />
          <Text style={[styles.label, styles.dangerLabel]}>Disband Team</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityLabel="Leave team"
        accessibilityRole="button"
        onPress={onLeaveTeam}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Ionicons color={colors.danger} name="exit-outline" size={16} />
        <Text style={[styles.label, styles.dangerLabel]}>Leave Team</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  dangerLabel: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
});
