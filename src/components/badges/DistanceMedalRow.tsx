import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { RANK_TIER_COLORS } from '../team/rankAvatarBorderTheme';
import { colors, spacing } from '../../theme';
import type { DistanceBadge } from '../../services/distanceRecords';
import type { DistanceMilestoneKey } from '../../services/activityStreams';

const SHORT_LABELS: Record<DistanceMilestoneKey, string> = {
  half_mile: '1/2 Mile',
  one_k: '1k',
  mile: '1 Mile',
  five_k: '5k',
  five_mile: '5 Mile',
  ten_k: '10k',
  half_marathon: 'half',
  marathon: 'marathon',
};

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

type DistanceMedalRowProps = {
  badges: DistanceBadge[];
};

/** A row of gold/silver/bronze medal chips — a run can earn several at once
 * (e.g. a first-ever marathon qualifies for every shorter milestone too). */
export function DistanceMedalRow({ badges }: DistanceMedalRowProps) {
  if (badges.length === 0) return null;

  const sorted = [...badges].sort((a, b) => a.rank - b.rank);

  return (
    <View style={styles.row}>
      {sorted.map((badge) => {
        const color = RANK_COLORS[badge.rank];
        return (
          <View key={badge.distanceKey} style={[styles.chip, { borderColor: color }]}>
            <Ionicons color={color} name="medal" size={18} />
            <Text style={[styles.label, { color }]}>
              {RANK_PREFIX[badge.rank]} {SHORT_LABELS[badge.distanceKey]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
