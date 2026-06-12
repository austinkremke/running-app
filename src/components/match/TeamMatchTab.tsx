import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MOCK_MATCHMAKING } from '../../mock';
import type { MatchRunner } from '../../mock';
import { colors, spacing } from '../../theme';
import { AvailableRunnersSection } from './AvailableRunnersSection';
import { FindMatchButton } from './FindMatchButton';
import { LineupSection } from './LineupSection';
import { MatchFormatCard } from './MatchFormatCard';
import { MatchTeamSummaryCard } from './MatchTeamSummaryCard';
import { SearchingForTeamCard } from './SearchingForTeamCard';
import { TeamMatchPreviewButton } from './team/TeamMatchPreviewButton';

type TeamMatchTabProps = {
  onViewActiveMatch?: () => void;
};

export function TeamMatchTab({ onViewActiveMatch }: TeamMatchTabProps) {
  const config = MOCK_MATCHMAKING;
  const [lineup, setLineup] = useState<MatchRunner[]>(config.lineup);
  const [available, setAvailable] = useState<MatchRunner[]>(config.available);
  const [isSearching, setIsSearching] = useState(false);

  const canAdd = lineup.length < config.maxLineup;

  function handleRemove(runnerId: string) {
    const runner = lineup.find((item) => item.id === runnerId);
    if (!runner) {
      return;
    }

    setLineup((current) => current.filter((item) => item.id !== runnerId));
    setAvailable((current) => [...current, runner]);
  }

  function handleAdd(runnerId: string) {
    if (!canAdd) {
      return;
    }

    const runner = available.find((item) => item.id === runnerId);
    if (!runner) {
      return;
    }

    setAvailable((current) => current.filter((item) => item.id !== runnerId));
    setLineup((current) => [...current, runner]);
  }

  function handleFindMatch() {
    setIsSearching(true);
  }

  function handleCancelSearch() {
    setIsSearching(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <MatchTeamSummaryCard
          powerRating={config.powerRating}
          shieldAccent={config.shieldAccent}
          shieldIcon={config.shieldIcon}
          teamLevel={config.teamLevel}
          teamName={config.teamName}
        />

        <TeamMatchPreviewButton onPress={onViewActiveMatch} />

        {isSearching ? (
          <SearchingForTeamCard onCancel={handleCancelSearch} />
        ) : (
          <MatchFormatCard format={config.matchFormat} />
        )}

        <LineupSection
          lineup={lineup}
          maxLineup={config.maxLineup}
          onRemove={handleRemove}
        />
        <AvailableRunnersSection canAdd={canAdd} onAdd={handleAdd} runners={available} />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FindMatchButton disabled={isSearching} onPress={handleFindMatch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.md,
  },
});
