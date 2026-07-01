import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { AchievementListItem } from '../../services/achievementService';
import { colors, spacing } from '../../theme';
import { HexBadge } from './HexBadge';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type AchievementCardProps = {
  achievement: AchievementListItem;
  layout?: 'compact' | 'detail';
};

export function formatAchievementXp(xpReward: number): string {
  return `+${xpReward.toLocaleString()} XP`;
}

export function AchievementCard({ achievement, layout = 'compact' }: AchievementCardProps) {
  const iconSize = achievement.badgeText ? 14 : 20;

  if (layout === 'detail') {
    return (
      <View style={[styles.detailCard, !achievement.unlocked && styles.detailCardLocked]}>
        <HexBadge
          badgeText={achievement.badgeText}
          icon={achievement.icon as IoniconsName}
          iconSize={iconSize}
          size={52}
          stroked
          variant={achievement.variant}
        />

        <View style={styles.detailBody}>
          <Text style={styles.detailTitle}>{achievement.label}</Text>
          <Text style={styles.detailDescription}>{achievement.description}</Text>

          <View style={styles.detailMeta}>
            {achievement.unlocked ? (
              <Text style={styles.completedLabel}>Completed</Text>
            ) : (
              <>
                <View style={styles.xpChip}>
                  <Ionicons color={colors.accentLime} name="flash" size={10} />
                  <Text style={styles.xpChipLabel}>{formatAchievementXp(achievement.xpReward)}</Text>
                </View>
                <Text style={styles.detailStatus}>Not unlocked yet</Text>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.compactCard, !achievement.unlocked && styles.compactCardLocked]}>
      <HexBadge
        badgeText={achievement.badgeText}
        icon={achievement.icon as IoniconsName}
        iconSize={iconSize}
        size={52}
        stroked
        variant={achievement.variant}
      />
      <Text numberOfLines={2} style={styles.compactLabel}>
        {achievement.label}
      </Text>
      <Text numberOfLines={3} style={styles.compactDescription}>
        {achievement.description}
      </Text>
      {achievement.unlocked ? (
        <Text style={styles.completedLabel}>Completed</Text>
      ) : (
        <View style={styles.xpChip}>
          <Ionicons color={colors.accentLime} name="flash" size={10} />
          <Text style={styles.xpChipLabel}>{formatAchievementXp(achievement.xpReward)}</Text>
        </View>
      )}
    </View>
  );
}

export const ACHIEVEMENT_CARD_WIDTH = 168;

const styles = StyleSheet.create({
  compactCard: {
    width: ACHIEVEMENT_CARD_WIDTH,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  compactCardLocked: {
    borderColor: colors.divider,
  },
  compactLabel: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  compactDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  completedLabel: {
    color: colors.accentLime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 2,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  detailCardLocked: {
    borderColor: colors.divider,
  },
  detailBody: {
    flex: 1,
    gap: spacing.xs,
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  detailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  detailStatus: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(215, 255, 47, 0.08)',
  },
  xpChipLabel: {
    color: colors.accentLime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
