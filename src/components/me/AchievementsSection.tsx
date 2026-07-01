import { ScrollView, StyleSheet, View } from 'react-native';

import type { AchievementListItem } from '../../services/achievementService';
import { spacing } from '../../theme';
import { ACHIEVEMENT_CARD_WIDTH, AchievementCard } from './AchievementCard';
import { SectionHeader } from './SectionHeader';

type AchievementsSectionProps = {
  achievements: AchievementListItem[];
  onViewAll?: () => void;
};

const CARD_GAP = spacing.md;

export function AchievementsSection({ achievements, onViewAll }: AchievementsSectionProps) {
  return (
    <View style={styles.container}>
      <SectionHeader actionLabel="VIEW ALL" onActionPress={onViewAll} title="ACHIEVEMENTS" />

      <ScrollView
        contentContainerStyle={styles.carousel}
        decelerationRate="fast"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={ACHIEVEMENT_CARD_WIDTH + CARD_GAP}
      >
        {achievements.map((achievement) => (
          <AchievementCard achievement={achievement} key={achievement.id} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  carousel: {
    gap: CARD_GAP,
  },
});
