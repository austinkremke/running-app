import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { MatchRunner } from '../../mock';
import { colors, spacing } from '../../theme';
import { TeamRoleBadge } from '../team/TeamRoleBadge';

type LineupRunnerRowProps = {
  runner: MatchRunner;
  selected?: boolean;
  onToggle?: () => void;
  showDivider?: boolean;
};

const AVATAR_SIZE = 36;

export function LineupRunnerRow({
  runner,
  selected = false,
  onToggle,
  showDivider = true,
}: LineupRunnerRowProps) {
  return (
    <View>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={selected ? 'Remove from lineup' : 'Add to lineup'}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onToggle}
          style={styles.selector}
        >
          {selected ? (
            <View style={styles.checkCircle}>
              <Ionicons color={colors.background} name="checkmark" size={12} />
            </View>
          ) : (
            <View style={styles.emptyCircle} />
          )}
        </Pressable>

        <View style={styles.avatarWrap}>
          {runner.avatarUrl ? (
            <Image source={{ uri: runner.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
        </View>

        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {runner.name}
            </Text>
            {runner.role ? <TeamRoleBadge role={runner.role} /> : null}
          </View>
          <Text style={styles.level}>Level {runner.level}</Text>
        </View>

        <View style={styles.statsGroup}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{runner.seasonAvg}</Text>
            <Text style={styles.statLabel}>Season Avg</Text>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statValue}>{runner.totalMiles}</Text>
            <Text style={styles.statLabel}>Total Miles</Text>
          </View>
        </View>
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
    paddingHorizontal: spacing.sm,
  },
  selector: {
    width: 22,
    alignItems: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentLime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 4,
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
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
    minWidth: 64,
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
  level: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statsDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.divider,
    marginHorizontal: spacing.sm,
    marginVertical: 2,
  },
  statCol: {
    width: 54,
    alignItems: 'center',
    gap: 1,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.sm,
  },
});
