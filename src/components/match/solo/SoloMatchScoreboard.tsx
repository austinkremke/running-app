import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { ActiveSoloMatch } from '../../../mock';
import { useLiveCountdown } from '../../../hooks/useLiveCountdown';
import { colors, spacing } from '../../../theme';
import { MatchVsIndicator } from '../MatchVsIndicator';
import { formatMatchCountdownLabel } from '../../../services/matchMappers';
import { formatMatchPoints, getTeamMatchAccentColor } from './soloMatchTheme';
import { SoloMatchScoreboardRunner } from './SoloMatchScoreboardRunner';

type SoloMatchScoreboardProps = {
  match: ActiveSoloMatch;
  onMatchExpired?: () => void;
};

export function SoloMatchScoreboard({ match, onMatchExpired }: SoloMatchScoreboardProps) {
  const { homeRunner, awayRunner } = match;
  const isCompleted = match.status === 'completed';
  const countdown = useLiveCountdown(isCompleted ? null : match.endsAt, {
    onExpired: isCompleted ? undefined : onMatchExpired,
  });
  const pointDiff = homeRunner.totalPoints - awayRunner.totalPoints;
  const isTied = pointDiff === 0;
  const leadingRunner = pointDiff > 0 ? homeRunner : awayRunner;
  const leadColor = getTeamMatchAccentColor(leadingRunner.accent);
  const totalPoints = homeRunner.totalPoints + awayRunner.totalPoints;
  const homeShare = isTied ? 0.5 : totalPoints > 0 ? homeRunner.totalPoints / totalPoints : 0.5;
  const tiedLabel =
    homeRunner.totalPoints === 0
      ? 'MATCH TIED'
      : `TIED AT ${formatMatchPoints(homeRunner.totalPoints)} PTS${isCompleted ? ' — FINAL' : ''}`;

  return (
    <View style={styles.container}>
      <View style={styles.runnersRow}>
        <SoloMatchScoreboardRunner runner={homeRunner} side="home" />

        <MatchVsIndicator style={styles.vsWrap} variant="diamond" />

        <SoloMatchScoreboardRunner runner={awayRunner} side="away" />
      </View>

      <View style={styles.statusSection}>
        <View style={styles.leadRow}>
          {isTied ? (
            <>
              <Ionicons color={colors.textSecondary} name="remove-outline" size={12} />
              <Text style={[styles.leadText, styles.tiedText]}>{tiedLabel}</Text>
            </>
          ) : (
            <>
              <Ionicons
                color={leadColor}
                name={isCompleted ? 'trophy' : 'trending-up'}
                size={12}
              />
              <Text style={[styles.leadText, { color: leadColor }]}>
                {isCompleted
                  ? `${leadingRunner.name.toUpperCase()} WON`
                  : `${leadingRunner.name.toUpperCase()} LEADS BY ${formatMatchPoints(Math.abs(pointDiff))} PTS`}
              </Text>
            </>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.countdownRow}>
          <Ionicons
            color={colors.textSecondary}
            name={isCompleted ? 'checkmark-circle-outline' : 'time-outline'}
            size={13}
          />
          <Text style={styles.countdownText}>
            {isCompleted ? 'MATCH COMPLETE' : formatMatchCountdownLabel(countdown)}
          </Text>
        </View>

        <View style={[styles.progressTrack, isTied && styles.progressTrackTied]}>
          <View
            style={[
              styles.progressHome,
              {
                width: `${homeShare * 100}%`,
                backgroundColor: isTied ? colors.divider : getTeamMatchAccentColor(homeRunner.accent),
              },
            ]}
          />
          <View
            style={[
              styles.progressAway,
              {
                width: `${(1 - homeShare) * 100}%`,
                backgroundColor: isTied ? colors.divider : getTeamMatchAccentColor(awayRunner.accent),
              },
            ]}
          />
        </View>

        <View style={styles.progressLabels}>
          <Text
            style={[
              styles.progressLabel,
              { color: isTied ? colors.textSecondary : getTeamMatchAccentColor(homeRunner.accent) },
            ]}
          >
            {formatMatchPoints(homeRunner.totalPoints)}
          </Text>
          <Text
            style={[
              styles.progressLabel,
              { color: isTied ? colors.textSecondary : getTeamMatchAccentColor(awayRunner.accent) },
            ]}
          >
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
  tiedText: {
    color: colors.textSecondary,
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
  progressTrackTied: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
