import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../avatar';
import { UserLevelBadge } from '../../feed/UserLevelBadge';
import type { TeamMatchAccent, TeamMatchParticipant } from '../../../mock';
import { colors, spacing } from '../../../theme';
import {
  formatChallengeDistance,
  formatChallengePace,
  formatMatchPoints,
  getTeamMatchAccentColor,
  TEAM_MATCH_AVATAR_BORDER_WIDTH,
  TEAM_MATCH_LEVEL_BADGE_STROKE_WIDTH,
} from './matchTheme';

type TeamMatchRosterRowProps = {
  participant: TeamMatchParticipant;
  accent: TeamMatchAccent;
  showDivider?: boolean;
};

const ROSTER_AVATAR_SIZE = 32;

export function TeamMatchRosterRow({
  participant,
  accent,
  showDivider = true,
}: TeamMatchRosterRowProps) {
  const accentColor = getTeamMatchAccentColor(accent);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Avatar
            avatarUrl={participant.avatarUrl}
            borderColor={accentColor}
            borderWidth={TEAM_MATCH_AVATAR_BORDER_WIDTH}
            size={ROSTER_AVATAR_SIZE}
          />
          <UserLevelBadge
            bottom={-2}
            color={accentColor}
            level={participant.level}
            strokeWidth={TEAM_MATCH_LEVEL_BADGE_STROKE_WIDTH}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text numberOfLines={1} style={styles.name}>
              {participant.name}
            </Text>
            <Text style={[styles.points, { color: accentColor }]}>
              {formatMatchPoints(participant.points)} PTS
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text numberOfLines={1} style={styles.statText}>
              {formatChallengeDistance(participant.challengeStats)}
            </Text>
            <View style={styles.statsDivider} />
            <Text numberOfLines={1} style={styles.statText}>
              {formatChallengePace(participant.challengeStats)}
            </Text>
          </View>
        </View>
      </View>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  avatarWrap: {
    width: ROSTER_AVATAR_SIZE + 4,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  points: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  statsDivider: {
    width: 1,
    height: 10,
    backgroundColor: colors.divider,
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
