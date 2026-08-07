import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { DistanceMedalRow } from '../badges';
import type { DistanceBadge } from '../../services/distanceRecords';

type RunCardContentProps = {
  title: string;
  description: string;
  /** Rendered inline with the description so badges (which resolve async,
   *  after the description is already on screen) pop into an existing row
   *  instead of pushing in a new one below — avoids layout shift. */
  distanceBadges?: DistanceBadge[];
};

export function RunCardContent({ title, description, distanceBadges }: RunCardContentProps) {
  const hasDescription = description.trim().length > 0;
  const hasBadges = Boolean(distanceBadges?.length);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {hasDescription || hasBadges ? (
        <View style={styles.metaRow}>
          {hasDescription ? <Text style={styles.description}>{description}</Text> : null}
          {hasBadges ? <DistanceMedalRow badges={distanceBadges!} compact /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
