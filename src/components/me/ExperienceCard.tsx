import { StyleSheet, Text, View } from 'react-native';

import type { ProfileExperience } from '../../mock';
import { colors, spacing } from '../../theme';
import { XpProgressBar } from './XpProgressBar';

type ExperienceCardProps = {
  experience: ProfileExperience;
};

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const { currentXp, nextLevelXp } = experience;
  const progress = Math.min(currentXp / nextLevelXp, 1);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>EXPERIENCE</Text>
        <Text style={styles.xpText}>
          <Text style={styles.xpCurrent}>{formatXp(currentXp)}</Text>
          <Text style={styles.xpTotal}> / {formatXp(nextLevelXp)} XP</Text>
        </Text>
      </View>

      <XpProgressBar height={18} progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
  },
  xpCurrent: {
    color: colors.accentLime,
  },
  xpTotal: {
    color: colors.textSecondary,
  },
});
