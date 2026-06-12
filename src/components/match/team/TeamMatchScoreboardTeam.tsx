import { StyleSheet, Text, View } from 'react-native';

import type { TeamMatchTeam } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { formatMatchPoints, getTeamMatchAccentColor } from './matchTheme';

type TeamMatchScoreboardTeamProps = {
  team: TeamMatchTeam;
  side: 'home' | 'away';
};

export function TeamMatchScoreboardTeam({ team, side }: TeamMatchScoreboardTeamProps) {
  const accentColor = getTeamMatchAccentColor(team.accent);
  const isHome = side === 'home';

  return (
    <View style={[styles.container, isHome ? styles.home : styles.away]}>
      <View style={styles.textBlock}>
        <Text numberOfLines={1} style={[styles.teamName, { color: accentColor }]}>
          {team.name.toUpperCase()}
        </Text>
        <Text style={styles.score}>{formatMatchPoints(team.totalPoints)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
  },
  home: {
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  away: {
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  textBlock: {
    alignItems: 'center',
    gap: 2,
  },
  teamName: {
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  score: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
});
