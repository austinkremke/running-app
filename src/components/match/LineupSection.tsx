import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { MatchRunner } from '../../mock';
import { colors, spacing } from '../../theme';
import { LineupRunnerRow } from './LineupRunnerRow';

type LineupSectionProps = {
  lineup: MatchRunner[];
  maxLineup: number;
  onRemove: (runnerId: string) => void;
};

export function LineupSection({ lineup, maxLineup, onRemove }: LineupSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            Select Your Lineup ({lineup.length}/{maxLineup})
          </Text>
          <Ionicons color={colors.textSecondary} name="information-circle-outline" size={13} />
        </View>
        <Text style={styles.subtitle}>Choose up to {maxLineup} runners to represent your team.</Text>
      </View>

      <View style={styles.list}>
        {lineup.map((runner, index) => (
          <LineupRunnerRow
            key={runner.id}
            onToggle={() => onRemove(runner.id)}
            runner={runner}
            selected
            showDivider={index < lineup.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
