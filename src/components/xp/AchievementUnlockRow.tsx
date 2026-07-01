import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { AchievementUnlockSummary } from '../../types/progression';
import { colors, spacing } from '../../theme';

type AchievementUnlockRowProps = {
  achievements: AchievementUnlockSummary[];
};

const TIER_COLORS: Record<string, string> = {
  bronze: colors.accentPurple,
  silver: colors.textSecondary,
  gold: colors.accentGold,
  elite: colors.accentLime,
};

function tierColor(tier: string): string {
  return TIER_COLORS[tier.toLowerCase()] ?? colors.accentPurple;
}

export function AchievementUnlockRow({ achievements }: AchievementUnlockRowProps) {
  if (achievements.length === 0) {
    return null;
  }

  const visible = achievements.slice(0, 2);
  const hiddenCount = achievements.length - visible.length;

  return (
    <View style={styles.container}>
      {visible.map((achievement) => (
        <View key={achievement.id} style={styles.badge}>
          <View style={[styles.iconWrap, { borderColor: tierColor(achievement.tier) }]}>
            <Ionicons
              color={tierColor(achievement.tier)}
              name={achievement.icon as keyof typeof Ionicons.glyphMap}
              size={18}
            />
          </View>
          <Text numberOfLines={1} style={styles.name}>
            {achievement.displayName}
          </Text>
        </View>
      ))}
      {hiddenCount > 0 ? (
        <Text style={styles.moreLabel}>+{hiddenCount} more</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '48%',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  name: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  moreLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
