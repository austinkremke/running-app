import { StyleSheet, Text, View } from 'react-native';

import type { TeamMatchTeam } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { rankBorderSourceForTier } from '../../team/rankAvatarBorderTheme';
import { TeamAvatar } from '../../team/TeamAvatar';
import { formatMatchPoints, getTeamMatchAccentColor } from './matchTheme';

const AVATAR_FRAME_SIZE = 72;
const PLAIN_AVATAR_SIZE = 64;

type TeamMatchScoreboardTeamProps = {
  team: TeamMatchTeam;
  side: 'home' | 'away';
};

export function TeamMatchScoreboardTeam({ team, side }: TeamMatchScoreboardTeamProps) {
  const accentColor = getTeamMatchAccentColor(team.accent);
  const isHome = side === 'home';
  const hasRankBorder = rankBorderSourceForTier(team.rankTierId) != null;
  const avatarSize = hasRankBorder ? AVATAR_FRAME_SIZE : PLAIN_AVATAR_SIZE;

  return (
    <View style={[styles.side, isHome ? styles.sideHome : styles.sideAway]}>
      <Text numberOfLines={1} style={[styles.teamName, { color: accentColor }]}>
        {team.name.toUpperCase()}
      </Text>
      <Text style={styles.score}>{formatMatchPoints(team.totalPoints)}</Text>
      <Text style={styles.pointsLabel}>TOTAL POINTS</Text>

      <View style={styles.avatarWrap}>
        <TeamAvatar
          accent={team.accent}
          icon={team.shieldIcon}
          rankTierId={team.rankTierId}
          size={avatarSize}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  sideHome: {
    paddingRight: spacing.xs,
  },
  sideAway: {
    paddingLeft: spacing.xs,
  },
  teamName: {
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
    maxWidth: '100%',
  },
  score: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  pointsLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'visible',
  },
});
