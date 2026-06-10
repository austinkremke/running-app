import { StyleSheet, Text, View } from 'react-native';

import type { MatchRunner } from '../../mock';
import { colors, spacing } from '../../theme';
import { LineupRunnerRow } from './LineupRunnerRow';

type AvailableRunnersSectionProps = {
  runners: MatchRunner[];
  onAdd: (runnerId: string) => void;
  canAdd: boolean;
};

export function AvailableRunnersSection({
  runners,
  onAdd,
  canAdd,
}: AvailableRunnersSectionProps) {
  if (runners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Runners</Text>

      <View style={styles.list}>
        {runners.map((runner, index) => (
          <LineupRunnerRow
            key={runner.id}
            onToggle={canAdd ? () => onAdd(runner.id) : undefined}
            runner={runner}
            showDivider={index < runners.length - 1}
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
  title: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
