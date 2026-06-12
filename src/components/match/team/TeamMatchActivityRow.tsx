import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../avatar';
import type { TeamMatchActivity } from '../../../mock';
import { colors, spacing } from '../../../theme';
import {
  formatMatchPoints,
  getTeamMatchAccentColor,
  TEAM_MATCH_AVATAR_BORDER_WIDTH,
} from './matchTheme';

type TeamMatchActivityRowProps = {
  activity: TeamMatchActivity;
  showDivider?: boolean;
};

export function TeamMatchActivityRow({ activity, showDivider = true }: TeamMatchActivityRowProps) {
  const accentColor = getTeamMatchAccentColor(activity.accent);

  return (
    <View>
      <View style={styles.row}>
        <Avatar
          avatarUrl={activity.avatarUrl}
          borderColor={accentColor}
          borderWidth={TEAM_MATCH_AVATAR_BORDER_WIDTH}
          size={28}
        />

        <View style={styles.meta}>
          <Text numberOfLines={2} style={styles.description}>
            <Text style={styles.playerName}>{activity.playerName}</Text> {activity.description}
          </Text>
        </View>

        <View style={styles.trailing}>
          <Text style={[styles.points, { color: accentColor }]}>
            +{formatMatchPoints(activity.pointsEarned)} PTS
          </Text>
          <Text style={styles.time}>{activity.timeAgo}</Text>
        </View>
      </View>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  playerName: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  points: {
    fontSize: 10,
    fontWeight: '800',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
