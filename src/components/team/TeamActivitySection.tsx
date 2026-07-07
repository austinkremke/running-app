import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Run } from '../../mock';
import { colors, spacing } from '../../theme';
import { TeamActivityRunRow } from './TeamActivityRunRow';

type TeamActivitySectionProps = {
  runs: Run[];
  loading?: boolean;
  onRunPress?: (run: Run) => void;
  onViewAll?: () => void;
};

export function TeamActivitySection({
  runs,
  loading = false,
  onRunPress,
  onViewAll,
}: TeamActivitySectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Activity</Text>
        <Pressable onPress={onViewAll} style={styles.action}>
          <Text style={styles.actionLabel}>View All</Text>
          <Ionicons color={colors.accentLime} name="chevron-forward" size={14} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accentLime} />
        </View>
      ) : runs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No team runs yet. Be the first to post one.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {runs.map((run, index) => (
            <TeamActivityRunRow
              key={run.id}
              onPress={onRunPress ? () => onRunPress(run) : undefined}
              run={run}
              showDivider={index < runs.length - 1}
            />
          ))}
        </View>
      )}
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
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLabel: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  loadingBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
