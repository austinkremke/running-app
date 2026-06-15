import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RunnerIcon } from '../../icons';
import type { SoloMatchActivity } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { formatMatchPoints, getTeamMatchAccentColor } from './soloMatchTheme';

type SoloMatchActivityRowProps = {
  activity: SoloMatchActivity;
  showDivider?: boolean;
};

export function SoloMatchActivityRow({ activity, showDivider = true }: SoloMatchActivityRowProps) {
  const accentColor = getTeamMatchAccentColor(activity.accent);

  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { borderColor: accentColor }]}>
          <RunnerIcon color={accentColor} size={14} />
        </View>

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
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
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
