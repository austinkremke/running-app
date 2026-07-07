import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { ActiveTeamMatch } from '../../../mock';
import { useLiveCountdown } from '../../../hooks/useLiveCountdown';
import { colors, spacing } from '../../../theme';
import { MatchVsIndicator } from '../MatchVsIndicator';
import { formatMatchCountdownLabel } from '../../../services/matchMappers';
import { formatMatchPoints, getTeamMatchAccentColor } from './matchTheme';
import { TeamMatchScoreboardTeam } from './TeamMatchScoreboardTeam';

type TeamMatchScoreboardProps = {
  match: ActiveTeamMatch;
};

export function TeamMatchScoreboard({ match }: TeamMatchScoreboardProps) {
  const { homeTeam, awayTeam } = match;
  const countdown = useLiveCountdown(match.endsAt);
  const pointDiff = homeTeam.totalPoints - awayTeam.totalPoints;
  const isTied = pointDiff === 0;
  const leadingTeam = pointDiff > 0 ? homeTeam : awayTeam;
  const leadColor = getTeamMatchAccentColor(leadingTeam.accent);
  const tiedLabel =
    homeTeam.totalPoints === 0 ? 'MATCH TIED' : `TIED AT ${formatMatchPoints(homeTeam.totalPoints)} PTS`;

  return (
    <View style={styles.container}>
      <View style={styles.teamsRow}>
        <TeamMatchScoreboardTeam side="home" team={homeTeam} />
        <MatchVsIndicator style={styles.vsWrap} variant="diamond" />
        <TeamMatchScoreboardTeam side="away" team={awayTeam} />
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
              <Ionicons color={leadColor} name="trending-up" size={12} />
              <Text style={[styles.leadText, { color: leadColor }]}>
                {leadingTeam.name.toUpperCase()} LEADS BY {formatMatchPoints(Math.abs(pointDiff))} PTS
              </Text>
            </>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.countdownRow}>
          <Ionicons color={colors.textSecondary} name="time-outline" size={13} />
          <Text style={styles.countdownText}>{formatMatchCountdownLabel(countdown)}</Text>
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
  statusSection: {
    gap: spacing.sm,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  vsWrap: {
    width: 36,
    paddingTop: 42,
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
});
