import { Animated, StyleSheet, Text, View } from 'react-native';

import type { AchievementUnlockSummary, XpGainRunSummary, XpGainSource } from '../../types/progression';
import { colors, spacing } from '../../theme';
import { AchievementUnlockRow } from './AchievementUnlockRow';

type XpGainSummaryProps = {
  source: XpGainSource;
  xpEarned: number;
  earnedOpacity: Animated.Value;
  runSummary?: XpGainRunSummary;
  achievementSummary?: AchievementUnlockSummary[];
};

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

function resolveEyebrow(source: XpGainSource, achievementCount: number): string {
  if (source === 'achievement') {
    return achievementCount === 1 ? 'Achievement Unlocked' : 'Achievements Unlocked';
  }

  if (source === 'combined' && achievementCount > 0) {
    return achievementCount === 1 ? 'Run Locked In · Achievement' : 'Run Locked In · Achievements';
  }

  return 'Run Locked In';
}

export function XpGainSummary({
  source,
  xpEarned,
  earnedOpacity,
  runSummary,
  achievementSummary = [],
}: XpGainSummaryProps) {
  const showRunStats = Boolean(runSummary) && source !== 'achievement';
  const showAchievements = achievementSummary.length > 0 && source !== 'run';

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{resolveEyebrow(source, achievementSummary.length)}</Text>
      <Animated.Text style={[styles.earned, { opacity: earnedOpacity }]}>
        +{formatXp(xpEarned)} XP
      </Animated.Text>

      {showRunStats && runSummary ? (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{runSummary.distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{runSummary.duration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{runSummary.pace}</Text>
            <Text style={styles.statLabel}>Pace</Text>
          </View>
        </View>
      ) : null}

      {showAchievements ? <AchievementUnlockRow achievements={achievementSummary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  earned: {
    color: colors.accentLime,
    fontSize: 36,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
});
