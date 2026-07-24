import { StyleSheet, View } from 'react-native';

import type { SoloRatingHistoryEntry } from '../../services/rank';
import { colors, spacing } from '../../theme';
import { MatchHistoryRow } from './MatchHistoryRow';
import { SectionHeader } from './SectionHeader';

const VISIBLE_COUNT = 3;

type CompetitiveHistorySectionProps = {
  entries: SoloRatingHistoryEntry[];
  viewerAvatarUrl?: string;
  viewerRankTierId?: string;
  /** Opens the full Competitive History graph — or the paywall, if the caller isn't premium. */
  onOpen: () => void;
};

export function CompetitiveHistorySection({
  entries,
  viewerAvatarUrl,
  viewerRankTierId,
  onOpen,
}: CompetitiveHistorySectionProps) {
  if (entries.length === 0) {
    return null;
  }

  const visibleEntries = entries.slice(0, VISIBLE_COUNT);

  return (
    <View style={styles.container}>
      <SectionHeader actionLabel="VIEW HISTORY" onActionPress={onOpen} title="COMPETITIVE HISTORY" />
      <View style={styles.card}>
        {visibleEntries.map((entry, index) => (
          <View key={entry.matchId}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <MatchHistoryRow
              entry={entry}
              onPress={onOpen}
              viewerAvatarUrl={viewerAvatarUrl}
              viewerRankTierId={viewerRankTierId}
            />
          </View>
        ))}
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
});
