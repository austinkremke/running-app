import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { SoloSeasonRecord } from '../../../mock';
import { colors, spacing } from '../../../theme';

type SoloSeasonRecordCardProps = {
  record: SoloSeasonRecord;
};

export function SoloSeasonRecordCard({ record }: SoloSeasonRecordCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>Season Record</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statValueLime}>{record.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statCol}>
          <Text style={styles.statValue}>{record.losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.streakCol}>
          <View style={styles.streakHeader}>
            <Ionicons color={colors.accentLime} name="flame" size={12} />
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <Text style={styles.statValueLime}>{record.bestStreak}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  streakCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  statValueLime: {
    color: colors.accentLime,
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 30,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 30,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
