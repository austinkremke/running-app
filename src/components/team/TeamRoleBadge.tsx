import { StyleSheet, Text, View } from 'react-native';

import type { TeamRole } from '../../mock';
import { colors } from '../../theme';

type TeamRoleBadgeProps = {
  role: TeamRole;
};

const ROLE_STYLES: Record<TeamRole, { background: string; color: string; label: string }> = {
  leader: {
    background: 'rgba(215, 255, 47, 0.15)',
    color: colors.accentLime,
    label: 'Leader',
  },
  'co-leader': {
    background: 'rgba(155, 92, 255, 0.15)',
    color: colors.accentPurple,
    label: 'Co-Leader',
  },
};

export function TeamRoleBadge({ role }: TeamRoleBadgeProps) {
  const palette = ROLE_STYLES[role];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.color }]}>{palette.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
