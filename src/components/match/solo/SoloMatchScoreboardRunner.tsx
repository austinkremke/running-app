import { StyleSheet, Text, View } from 'react-native';

import { UserLevelBadge } from '../../feed/UserLevelBadge';
import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { rankBorderSourceForTier } from '../../team/rankAvatarBorderTheme';
import type { SoloMatchRunner } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { formatMatchPoints, getTeamMatchAccentColor } from './soloMatchTheme';
import { TEAM_MATCH_LEVEL_BADGE_STROKE_WIDTH } from '../team/matchTheme';

type SoloMatchScoreboardRunnerProps = {
  runner: SoloMatchRunner;
  side: 'home' | 'away';
};

const AVATAR_FRAME_SIZE = 72;
const PLAIN_AVATAR_SIZE = 64;

export function SoloMatchScoreboardRunner({ runner, side }: SoloMatchScoreboardRunnerProps) {
  const accentColor = getTeamMatchAccentColor(runner.accent);
  const isHome = side === 'home';
  const hasRankBorder = rankBorderSourceForTier(runner.rankTierId) != null;
  const avatarSize = hasRankBorder ? AVATAR_FRAME_SIZE : PLAIN_AVATAR_SIZE;

  return (
    <View style={[styles.side, isHome ? styles.sideHome : styles.sideAway]}>
      <Text style={[styles.name, { color: accentColor }]}>{runner.name.toUpperCase()}</Text>
      <Text style={styles.score}>{formatMatchPoints(runner.totalPoints)}</Text>
      <Text style={styles.pointsLabel}>TOTAL POINTS</Text>

      <View style={styles.avatarWrap}>
        <RankBorderAvatar avatarUrl={runner.avatarUrl} rankTierId={runner.rankTierId} size={avatarSize} />
        <UserLevelBadge
          bottom={-2}
          color={accentColor}
          level={runner.level}
          strokeWidth={TEAM_MATCH_LEVEL_BADGE_STROKE_WIDTH}
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
  name: {
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
