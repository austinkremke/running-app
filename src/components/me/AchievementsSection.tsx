import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { Achievement } from '../../mock';
import { colors, spacing } from '../../theme';
import { ACHIEVEMENT_CARD_WIDTH, AchievementCard } from './AchievementCard';
import { SectionHeader } from './SectionHeader';

type AchievementsSectionProps = {
  achievements: Achievement[];
  onViewAll?: () => void;
};

const CARD_GAP = spacing.md;

export function AchievementsSection({ achievements, onViewAll }: AchievementsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pageCount = Math.max(1, Math.ceil(achievements.length / 3));

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (ACHIEVEMENT_CARD_WIDTH + CARD_GAP));
    setActiveIndex(Math.min(Math.max(index, 0), achievements.length - 1));
  }

  return (
    <View style={styles.container}>
      <SectionHeader actionLabel="VIEW ALL" onActionPress={onViewAll} title="ACHIEVEMENTS" />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.carousel}
        decelerationRate="fast"
        horizontal
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={ACHIEVEMENT_CARD_WIDTH + CARD_GAP}
      >
        {achievements.map((achievement) => (
          <AchievementCard achievement={achievement} key={achievement.id} />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {Array.from({ length: pageCount }, (_, index) => (
          <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accentLime,
  },
});
