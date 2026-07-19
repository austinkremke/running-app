import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../avatar';
import type { SoloMatchActivity } from '../../../mock';
import { colors, spacing } from '../../../theme';
import {
  formatMatchPoints,
  getTeamMatchAccentColor,
  TEAM_MATCH_AVATAR_BORDER_WIDTH,
} from './soloMatchTheme';

type SoloMatchActivityRowProps = {
  activity: SoloMatchActivity;
  onPress?: () => void;
  showDivider?: boolean;
};

export function SoloMatchActivityRow({ activity, onPress, showDivider = true }: SoloMatchActivityRowProps) {
  const accentColor = getTeamMatchAccentColor(activity.accent);

  return (
    <View>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={styles.row}
      >
        <Avatar
          avatarUrl={activity.avatarUrl}
          borderColor={accentColor}
          borderWidth={TEAM_MATCH_AVATAR_BORDER_WIDTH}
          size={28}
        />

        <View style={styles.meta}>
          <Text style={styles.day}>{activity.dayLabel}</Text>
          <Text style={styles.distance}>{activity.distanceMiles.toFixed(2)} mi</Text>
        </View>

        <View style={styles.trailing}>
          <Text style={styles.duration}>{activity.durationLabel}</Text>
          <Text style={[styles.points, { color: accentColor }]}>
            +{formatMatchPoints(activity.pointsEarned)} pts
          </Text>
        </View>
      </Pressable>

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
    gap: 2,
  },
  day: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  distance: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  points: {
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
