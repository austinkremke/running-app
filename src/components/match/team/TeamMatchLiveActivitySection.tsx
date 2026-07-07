import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TeamMatchActivity } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { TeamMatchActivityRow } from './TeamMatchActivityRow';

const PREVIEW_COUNT = 5;

type TeamMatchLiveActivitySectionProps = {
  activities: TeamMatchActivity[];
  onSelectActivity?: (activity: TeamMatchActivity) => void;
  onViewAll?: () => void;
};

export function TeamMatchLiveActivitySection({
  activities,
  onSelectActivity,
  onViewAll,
}: TeamMatchLiveActivitySectionProps) {
  const preview = activities.slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons color={colors.accentLime} name="pulse" size={14} />
          <Text style={styles.title}>Live Activity</Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onViewAll} style={styles.action}>
          <Text style={styles.actionLabel}>View All</Text>
          <Ionicons color={colors.accentLime} name="chevron-forward" size={14} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {preview.map((activity, index) => (
          <TeamMatchActivityRow
            activity={activity}
            key={activity.id}
            onPress={onSelectActivity ? () => onSelectActivity(activity) : undefined}
            showDivider={index < preview.length - 1}
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    textTransform: 'uppercase',
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
});
