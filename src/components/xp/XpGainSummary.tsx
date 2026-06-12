import { Animated, StyleSheet, Text, View } from 'react-native';

import type { XpGainRunSummary } from '../../mock';
import { colors, spacing } from '../../theme';

type XpGainSummaryProps = {
  xpEarned: number;
  earnedOpacity: Animated.Value;
  runSummary?: XpGainRunSummary;
};

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

export function XpGainSummary({ xpEarned, earnedOpacity, runSummary }: XpGainSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Run Complete</Text>
      <Animated.Text style={[styles.earned, { opacity: earnedOpacity }]}>
        +{formatXp(xpEarned)} XP
      </Animated.Text>

      {runSummary ? (
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
