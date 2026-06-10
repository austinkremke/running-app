import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Achievement } from '../../mock';
import { colors, spacing } from '../../theme';
import { HexBadge } from './HexBadge';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type AchievementCardProps = {
  achievement: Achievement;
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const iconSize = achievement.badgeText ? 14 : 20;

  return (
    <View style={styles.card}>
      <HexBadge
        badgeText={achievement.badgeText}
        icon={achievement.icon as IoniconsName}
        iconSize={iconSize}
        size={52}
        stroked
        variant={achievement.variant}
      />
      <Text numberOfLines={2} style={styles.label}>
        {achievement.label}
      </Text>
      <Text style={styles.date}>{achievement.date}</Text>
    </View>
  );
}

export const ACHIEVEMENT_CARD_WIDTH = 108;

const styles = StyleSheet.create({
  card: {
    width: ACHIEVEMENT_CARD_WIDTH,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  date: {
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },
});
