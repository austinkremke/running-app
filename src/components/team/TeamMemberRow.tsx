import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { TeamMember } from '../../mock';
import { colors, spacing } from '../../theme';
import { HexBadge } from '../me/HexBadge';
import { TeamRoleBadge } from './TeamRoleBadge';

type TeamMemberRowProps = {
  member: TeamMember;
  showDivider?: boolean;
  /** Shows the ⋮ menu and handles taps — pass only when the viewer can manage this member. */
  onOptionsPress?: (member: TeamMember) => void;
};

const AVATAR_SIZE = 36;

export function TeamMemberRow({ member, showDivider = true, onOptionsPress }: TeamMemberRowProps) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatarRing,
              member.isOnline && styles.avatarRingOnline,
            ]}
          >
            {member.avatarUrl ? (
              <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {member.name}
            </Text>
            {member.role ? <TeamRoleBadge role={member.role} /> : null}
          </View>
          <View style={styles.statusRow}>
            {member.isOnline ? <View style={styles.onlineDot} /> : null}
            <Text style={styles.status}>{member.status}</Text>
          </View>
        </View>

        <HexBadge badgeText={String(member.level)} size={30} stroked variant="purple" />

        <View style={styles.statsDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{member.distance}</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Power</Text>
          <Text style={styles.powerValue}>{member.power}</Text>
        </View>

        {onOptionsPress ? (
          <Pressable
            accessibilityLabel="Member options"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onOptionsPress(member)}
            style={styles.menu}
          >
            <Ionicons color={colors.textSecondary} name="ellipsis-vertical" size={14} />
          </Pressable>
        ) : (
          <View style={styles.menu} />
        )}
      </View>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarRingOnline: {
    borderColor: colors.accentLime,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
  },
  meta: {
    flex: 1,
    minWidth: 72,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentLime,
  },
  status: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  statsDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  statCol: {
    width: 58,
    gap: 1,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  powerValue: {
    color: colors.accentPurple,
    fontSize: 10,
    fontWeight: '700',
  },
  menu: {
    paddingHorizontal: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
