import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RANK_TIER_COLORS } from '../team/rankAvatarBorderTheme';
import { distanceMilestoneLabel } from '../../services/distanceRecords';
import { formatDurationClock } from '../../services/distanceService';
import type { DistanceMilestoneKey } from '../../services/activityStreams';
import { colors, spacing } from '../../theme';

const RANK_PREFIX: Record<1 | 2 | 3, string> = {
  1: 'Fastest',
  2: '2nd Fastest',
  3: '3rd Fastest',
};

const RANK_COLORS: Record<1 | 2 | 3, string> = {
  1: RANK_TIER_COLORS.gold,
  2: RANK_TIER_COLORS.silver,
  3: RANK_TIER_COLORS.bronze,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type PersonalRecordCardProps = {
  distanceKey: DistanceMilestoneKey;
  rank: 1 | 2 | 3;
  splitSeconds: number;
  achievedAt: string;
  onPress?: () => void;
};

export function PersonalRecordCard({
  distanceKey,
  rank,
  splitSeconds,
  achievedAt,
  onPress,
}: PersonalRecordCardProps) {
  const headline = `${RANK_PREFIX[rank]} ${distanceMilestoneLabel(distanceKey)}`;

  return (
    <Pressable
      accessibilityHint="Opens the run that set this record"
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <Ionicons color={RANK_COLORS[rank]} name="medal" size={26} />
      <View style={styles.body}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.date}>{formatDate(achievedAt)}</Text>
      </View>
      <Text style={styles.time}>{formatDurationClock(splitSeconds)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  time: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
