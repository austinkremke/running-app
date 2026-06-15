import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SoloMatchActivity } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { SoloMatchActivityRow } from './SoloMatchActivityRow';

type SoloMatchActivitySectionProps = {
  activities: SoloMatchActivity[];
};

export function SoloMatchActivitySection({ activities }: SoloMatchActivitySectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LATEST ACTIVITY</Text>

      <View style={styles.list}>
        {activities.map((activity, index) => (
          <SoloMatchActivityRow
            activity={activity}
            key={activity.id}
            showDivider={index < activities.length - 1}
          />
        ))}
      </View>

      <Pressable accessibilityRole="button" style={styles.action}>
        <Text style={styles.actionLabel}>VIEW ALL ACTIVITY</Text>
        <Ionicons color={colors.accentLime} name="chevron-forward" size={14} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
  },
  actionLabel: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});
