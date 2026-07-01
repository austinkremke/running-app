import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AchievementListItem } from '../../services/achievementService';
import { isAchievementCardActionable } from '../../services/achievementCardActions';
import { colors, spacing } from '../../theme';
import { AchievementCard } from './AchievementCard';

type AchievementsAllModalProps = {
  visible: boolean;
  achievements: AchievementListItem[];
  onClose: () => void;
  onAchievementPress?: (achievement: AchievementListItem) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  distance: 'Distance',
  consistency: 'Consistency',
  performance: 'Performance',
  social: 'Social',
  community: 'Community',
  team: 'Team',
  competitive: 'Competitive',
  longterm: 'Long-term',
};

export function AchievementsAllModal({
  visible,
  achievements,
  onClose,
  onAchievementPress,
}: AchievementsAllModalProps) {
  const insets = useSafeAreaInsets();
  const categories = [...new Set(achievements.map((item) => item.category))];
  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>
              {unlockedCount} of {achievements.length} unlocked
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {categories.map((category) => {
            const items = achievements.filter((item) => item.category === category);
            return (
              <View key={category} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {CATEGORY_LABELS[category] ?? category}
                </Text>
                <View style={styles.list}>
                  {items.map((achievement) => (
                    <AchievementCard
                      achievement={achievement}
                      key={achievement.id}
                      layout="detail"
                      onPress={
                        onAchievementPress &&
                        isAchievementCardActionable(achievement.id, achievement.unlocked)
                          ? () => onAchievementPress(achievement)
                          : undefined
                      }
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  closeLabel: {
    color: colors.accentLime,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  list: {
    gap: spacing.md,
  },
});
