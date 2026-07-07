import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { ACHIEVEMENT_CARD_WIDTH } from './AchievementCard';
import { SectionHeader } from './SectionHeader';

const CARD_GAP = spacing.md;
const PLACEHOLDER_COUNT = 3;

/** Mirrors AchievementsSection's dimensions so the carousel loading in doesn't shift layout (CLS). */
export function AchievementsSkeleton() {
  return (
    <View style={styles.container}>
      <SectionHeader title="ACHIEVEMENTS" />

      <ScrollView
        contentContainerStyle={styles.carousel}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.badge} />
            <View style={styles.lineWide} />
            <View style={styles.lineNarrow} />
          </View>
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
  card: {
    width: ACHIEVEMENT_CARD_WIDTH,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceElevated,
  },
  lineWide: {
    width: '80%',
    height: 10,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
  },
  lineNarrow: {
    width: '55%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    marginTop: 2,
  },
});
