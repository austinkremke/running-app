import { StyleSheet, Text, View } from 'react-native';

import type { ProfileExperience } from '../../mock';
import { colors, spacing } from '../../theme';
import { HexBadge } from '../me/HexBadge';
import { XpProgressBar } from '../me/XpProgressBar';

type TeamLevelXpRowProps = {
  level: number;
  experience: ProfileExperience;
};

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

export function TeamLevelXpRow({ level, experience }: TeamLevelXpRowProps) {
  const { currentXp, nextLevelXp } = experience;
  const xpRemaining = nextLevelXp - currentXp;
  const progress = Math.min(currentXp / nextLevelXp, 1);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.levelBlock}>
          <HexBadge icon="paw" iconSize={12} size={28} variant="purple" />
          <View style={styles.levelMeta}>
            <Text style={styles.levelLabel}>LEVEL</Text>
            <Text style={styles.levelValue}>{level}</Text>
          </View>
        </View>

        <Text numberOfLines={1} style={styles.xpText}>
          <Text style={styles.xpCurrent}>{formatXp(currentXp)}</Text>
          <Text style={styles.xpTotal}> / {formatXp(nextLevelXp)} XP</Text>
        </Text>
      </View>

      <XpProgressBar height={6} progress={progress} />

      <Text numberOfLines={1} style={styles.remaining}>
        {formatXp(xpRemaining)} XP to next level
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  levelBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  levelMeta: {
    gap: 0,
  },
  levelLabel: {
    color: colors.accentPurple,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  levelValue: {
    color: colors.accentPurple,
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  xpText: {
    fontSize: 9,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  xpCurrent: {
    color: colors.accentLime,
  },
  xpTotal: {
    color: colors.textSecondary,
  },
  remaining: {
    color: colors.textSecondary,
    fontSize: 8,
  },
});
