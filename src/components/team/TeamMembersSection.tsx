import { StyleSheet, Text, View } from 'react-native';

import type { TeamMember } from '../../mock';
import { colors, spacing } from '../../theme';
import { TeamInviteButton } from './TeamInviteButton';
import { TeamMemberRow } from './TeamMemberRow';

type TeamMembersSectionProps = {
  members: TeamMember[];
  memberCount: number;
  memberMax: number;
  /** Per-member ⋮ menu handler; rows without management rights hide the menu. */
  onMemberOptionsPress?: (member: TeamMember) => void;
  /** Restrict which rows show the ⋮ menu (e.g. not yourself, not the leader). */
  canManageMember?: (member: TeamMember) => boolean;
};

export function TeamMembersSection({
  members,
  memberCount,
  memberMax,
  onMemberOptionsPress,
  canManageMember,
}: TeamMembersSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Members</Text>
          <Text style={styles.count}>
            {memberCount}/{memberMax} Members
          </Text>
        </View>
        <TeamInviteButton />
      </View>

      <View style={styles.list}>
        {members.map((member, index) => (
          <TeamMemberRow
            key={member.id}
            member={member}
            onOptionsPress={
              onMemberOptionsPress && (canManageMember?.(member) ?? true)
                ? onMemberOptionsPress
                : undefined
            }
            showDivider={index < members.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
});
