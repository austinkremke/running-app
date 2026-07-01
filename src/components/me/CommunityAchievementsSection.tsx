import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { COMMUNITY_LINKS } from '../../config/communityLinks';
import type { AchievementListItem } from '../../services/achievementService';
import { recordAchievementEvent } from '../../services/achievementService';
import { notifyAchievementUnlocks } from '../../services/achievementTriggers';
import { colors, spacing } from '../../theme';
import { SectionHeader } from './SectionHeader';

type CommunityAchievementsSectionProps = {
  achievements: AchievementListItem[];
  onUpdated?: () => void;
};

function isUnlocked(items: AchievementListItem[], id: string): boolean {
  return items.some((item) => item.id === id && item.unlocked);
}

export function CommunityAchievementsSection({
  achievements,
  onUpdated,
}: CommunityAchievementsSectionProps) {
  async function handleEvent(
    eventType: 'rate_app' | 'notifications_on' | 'follow_instagram' | 'follow_tiktok',
    url?: string,
  ) {
    if (url) {
      await Linking.openURL(url);
    }

    try {
      const unlocks = await recordAchievementEvent(eventType);
      if (unlocks.length > 0) {
        notifyAchievementUnlocks(unlocks);
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
  ];

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
              <Text style={[styles.rowLabel, row.done && styles.rowLabelDone]}>{row.label}</Text>
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  rowLabelDone: {
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
