import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { ActiveSoloMatch } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { MatchVsIndicator } from '../MatchVsIndicator';
import { formatMatchPoints, getTeamMatchAccentColor } from './soloMatchTheme';
import { SoloMatchScoreboardRunner } from './SoloMatchScoreboardRunner';

type SoloMatchScoreboardProps = {
  match: ActiveSoloMatch;
};

export function SoloMatchScoreboard({ match }: SoloMatchScoreboardProps) {
  const { homeRunner, awayRunner, countdown } = match;
  const pointDiff = homeRunner.totalPoints - awayRunner.totalPoints;
  const leadingRunner = pointDiff >= 0 ? homeRunner : awayRunner;
  const leadColor = getTeamMatchAccentColor(leadingRunner.accent);
  const totalPoints = homeRunner.totalPoints + awayRunner.totalPoints;
  const homeShare = totalPoints > 0 ? homeRunner.totalPoints / totalPoints : 0.5;

  return (
    <View style={styles.container}>
      <View style={styles.runnersRow}>
        <SoloMatchScoreboardRunner runner={homeRunner} side="home" />

        <MatchVsIndicator style={styles.vsWrap} variant="diamond" />

        <SoloMatchScoreboardRunner runner={awayRunner} side="away" />
      </View>

      <View style={styles.statusSection}>
        <View style={styles.leadRow}>
          <Ionicons color={leadColor} name="trending-up" size={12} />
          <Text style={[styles.leadText, { color: leadColor }]}>
            {leadingRunner.name.toUpperCase()} LEADS BY {formatMatchPoints(Math.abs(pointDiff))} PTS
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.countdownRow}>
          <Ionicons color={colors.textSecondary} name="time-outline" size={13} />
          <Text style={styles.countdownText}>
            ENDS IN {countdown.days}D {countdown.hours}H {countdown.minutes}M
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressHome,
              {
                width: `${homeShare * 100}%`,
                backgroundColor: getTeamMatchAccentColor(homeRunner.accent),
              },
            ]}
          />
          <View
            style={[
              styles.progressAway,
              {
                width: `${(1 - homeShare) * 100}%`,
                backgroundColor: getTeamMatchAccentColor(awayRunner.accent),
              },
            ]}
          />
        </View>

        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: getTeamMatchAccentColor(homeRunner.accent) }]}>
            {formatMatchPoints(homeRunner.totalPoints)}
          </Text>
          <Text style={[styles.progressLabel, { color: getTeamMatchAccentColor(awayRunner.accent) }]}>
            {formatMatchPoints(awayRunner.totalPoints)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  runnersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  vsWrap: {
    width: 36,
    paddingTop: 42,
  },
  statusSection: {
    gap: spacing.sm,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  leadText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countdownText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  progressHome: {
    height: '100%',
  },
  progressAway: {
    height: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
