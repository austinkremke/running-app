import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TeamStat } from '../../mock';
import { colors, spacing } from '../../theme';
import { TEAM_STAT_CARD_WIDTH, TeamStatItem } from './TeamStatItem';

type TeamStatsSectionProps = {
  stats: TeamStat[];
};

const CARD_GAP = spacing.md;

export function TeamStatsSection({ stats }: TeamStatsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Stats</Text>
        <Pressable style={styles.filter}>
          <Text style={styles.filterLabel}>All Time</Text>
          <Ionicons color={colors.textSecondary} name="chevron-down" size={12} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.carousel}
        decelerationRate="fast"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={TEAM_STAT_CARD_WIDTH + CARD_GAP}
      >
        {stats.map((stat) => (
          <TeamStatItem key={stat.id} stat={stat} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  carousel: {
    gap: CARD_GAP,
  },
});
