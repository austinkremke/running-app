import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../avatar';
import type { TeamMatchAccent, TeamMatchParticipant } from '../../../mock';
import { colors, spacing } from '../../../theme';
import {
  formatMatchPoints,
  getTeamMatchAccentColor,
  TEAM_MATCH_AVATAR_BORDER_WIDTH,
} from './matchTheme';

type TeamMatchRosterRowProps = {
  participant: TeamMatchParticipant;
  accent: TeamMatchAccent;
  showDivider?: boolean;
};

export function TeamMatchRosterRow({
  participant,
  accent,
  showDivider = true,
}: TeamMatchRosterRowProps) {
  const accentColor = getTeamMatchAccentColor(accent);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Avatar
          avatarUrl={participant.avatarUrl}
          borderColor={accentColor}
          borderWidth={TEAM_MATCH_AVATAR_BORDER_WIDTH}
          stretch
        />

        <View style={styles.content}>
          <View style={styles.detailsRow}>
            <View style={styles.meta}>
              <Text numberOfLines={1} style={styles.name}>
                {participant.name}
              </Text>
              <Text style={styles.level}>Level {participant.level}</Text>
            </View>

            <View style={styles.pointsCol}>
              <Text style={[styles.points, { color: accentColor }]}>
                {formatMatchPoints(participant.points)} PTS
              </Text>
              <Text style={styles.percent}>{participant.contributionPercent}%</Text>
            </View>
          </View>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${participant.contributionPercent}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  level: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  pointsCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  points: {
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  percent: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
