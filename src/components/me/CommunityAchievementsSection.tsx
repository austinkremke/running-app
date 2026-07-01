import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { COMMUNITY_LINKS } from '../../config/communityLinks';
import type { AchievementListItem } from '../../services/achievementService';
import { formatAchievementXp } from './AchievementCard';
import { useAchievementUnlockPresentation } from '../../hooks/useAchievementUnlockPresentation';
import { colors, spacing } from '../../theme';
import { SectionHeader } from './SectionHeader';

type CommunityAchievementsSectionProps = {
  achievements: AchievementListItem[];
  onUpdated?: () => void;
};

function isUnlocked(items: AchievementListItem[], id: string): boolean {
  return items.some((item) => item.id === id && item.unlocked);
}

function findAchievement(items: AchievementListItem[], id: string): AchievementListItem | undefined {
  return items.find((item) => item.id === id);
}

export function CommunityAchievementsSection({
  achievements,
  onUpdated,
}: CommunityAchievementsSectionProps) {
  const { recordEvent } = useAchievementUnlockPresentation();

  async function handleEvent(
    eventType: 'rate_app' | 'notifications_on' | 'follow_instagram' | 'follow_tiktok',
    url?: string,
  ) {
    if (url) {
      await Linking.openURL(url);
    }

    try {
      const unlocks = await recordEvent(eventType);
      if (unlocks.length > 0) {
        onUpdated?.();
      }
    } catch (error) {
      console.warn('Community achievement event failed', error);
    }
  }

  const rows = [
    {
      id: 'rate_app',
      label: 'Rate Run Off',
      icon: 'star-outline' as const,
      done: isUnlocked(achievements, 'rate_app'),
      onPress: () => {
        void handleEvent('rate_app', COMMUNITY_LINKS.appStoreReview);
      },
    },
    {
      id: 'notifications_on',
      label: 'Enable notifications',
      icon: 'notifications-outline' as const,
      done: isUnlocked(achievements, 'notifications_on'),
      onPress: () => {
        void Linking.openSettings();
        void handleEvent('notifications_on');
      },
    },
    {
      id: 'follow_instagram',
      label: 'Follow on Instagram',
      icon: 'logo-instagram' as const,
      done: isUnlocked(achievements, 'follow_instagram'),
      onPress: () => {
        void handleEvent('follow_instagram', COMMUNITY_LINKS.instagram);
      },
    },
    {
      id: 'follow_tiktok',
      label: 'Follow on TikTok',
      icon: 'logo-tiktok' as const,
      done: isUnlocked(achievements, 'follow_tiktok'),
      onPress: () => {
        void handleEvent('follow_tiktok', COMMUNITY_LINKS.tiktok);
      },
    },
  ].map((row) => {
    const achievement = findAchievement(achievements, row.id);
    return {
      ...row,
      description: achievement?.description ?? '',
      xpReward: achievement?.xpReward ?? 0,
    };
  });

  return (
    <View style={styles.container}>
      <SectionHeader title="COMMUNITY" />
      <View style={styles.card}>
        {rows.map((row) => (
          <Pressable
            key={row.id}
            accessibilityRole="button"
            disabled={row.done}
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.row,
              row.done && styles.rowDone,
              pressed && !row.done && styles.pressed,
            ]}
          >
            <View style={styles.rowLeft}>
              <Ionicons color={row.done ? colors.accentLime : colors.textPrimary} name={row.icon} size={18} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowLabel, row.done && styles.rowLabelDone]}>{row.label}</Text>
                {row.description ? (
                  <Text style={styles.rowDescription}>{row.description}</Text>
                ) : null}
                {row.xpReward > 0 ? (
                  <Text style={styles.rowXp}>{formatAchievementXp(row.xpReward)}</Text>
                ) : null}
              </View>
            </View>
            {row.done ? (
              <Ionicons color={colors.accentLime} name="checkmark-circle" size={18} />
            ) : (
              <Ionicons color={colors.textSecondary} name="chevron-forward" size={16} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDone: {
    opacity: 0.75,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  rowDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  rowXp: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  rowLabelDone: {
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
