import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { DistanceMilestoneKey } from '../../services/activityStreams';
import type { PersonalRecord } from '../../services/distanceRecords';
import { colors, spacing } from '../../theme';
import { PersonalRecordCard } from './PersonalRecordCard';
import { SectionHeader } from './SectionHeader';

const VISIBLE_COUNT = 3;

type PersonalRecordsSectionProps = {
  records: PersonalRecord[];
  /** Premium, dev-gated for now — opens the All-Time Bests screen, optionally scoped to a distance. */
  onViewAllTimeBests?: (distanceKey?: DistanceMilestoneKey) => void;
};

export function PersonalRecordsSection({
  records,
  onViewAllTimeBests,
}: PersonalRecordsSectionProps) {
  if (records.length === 0) {
    return null;
  }

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime(),
  );
  const visibleRecords = sortedRecords.slice(0, VISIBLE_COUNT);
  const hasMore = sortedRecords.length > VISIBLE_COUNT;

  return (
    <View style={styles.container}>
      <SectionHeader
        actionLabel={onViewAllTimeBests ? 'ALL-TIME BESTS' : undefined}
        onActionPress={onViewAllTimeBests ? () => onViewAllTimeBests() : undefined}
        title="PERSONAL RECORDS"
      />
      <View style={styles.card}>
        {visibleRecords.map((record, index) => (
          <View key={`${record.distanceKey}-${record.activityId}`}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <PersonalRecordCard
              achievedAt={record.achievedAt}
              distanceKey={record.distanceKey}
              onPress={onViewAllTimeBests ? () => onViewAllTimeBests(record.distanceKey) : undefined}
              rank={record.rank}
              splitSeconds={record.splitSeconds}
            />
          </View>
        ))}

        {hasMore ? (
          <LinearGradient
            colors={['transparent', colors.surface]}
            pointerEvents="none"
            style={styles.fade}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
  },
});
