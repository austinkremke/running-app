import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamMatchTeam } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { TeamAvatar } from '../../team/TeamAvatar';
import { formatMatchPoints, getTeamMatchAccentColor } from './matchTheme';

const SCORE_LINE_HEIGHT = 34;

type TeamMatchScoreboardTeamProps = {
  team: TeamMatchTeam;
  side: 'home' | 'away';
};

export function TeamMatchScoreboardTeam({ team, side }: TeamMatchScoreboardTeamProps) {
  const accentColor = getTeamMatchAccentColor(team.accent);
  const isHome = side === 'home';
  const [logoScoreWidth, setLogoScoreWidth] = useState(0);

  return (
    <View style={[styles.side, isHome ? styles.sideHome : styles.sideAway]}>
      <View style={styles.teamBlock}>
        <Text
          style={[
            styles.teamName,
            { color: accentColor },
            logoScoreWidth > 0 ? { width: logoScoreWidth } : null,
          ]}
        >
          {team.name.toUpperCase()}
        </Text>

        <View
          onLayout={(event) => setLogoScoreWidth(event.nativeEvent.layout.width)}
          style={styles.logoScoreRow}
        >
          {isHome ? (
            <>
              <TeamAvatar accent={team.accent} icon={team.shieldIcon} size={SCORE_LINE_HEIGHT} />
              <Text style={styles.score}>{formatMatchPoints(team.totalPoints)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.score}>{formatMatchPoints(team.totalPoints)}</Text>
              <TeamAvatar accent={team.accent} icon={team.shieldIcon} size={SCORE_LINE_HEIGHT} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    flex: 1,
    minWidth: 0,
  },
  sideHome: {
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  sideAway: {
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  teamBlock: {
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  teamName: {
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  logoScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    lineHeight: SCORE_LINE_HEIGHT,
  },
});
