import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AvailableRunnersSection,
  FindMatchButton,
  LineupSection,
  MatchDetailsCard,
  MatchTeamSummaryCard,
} from '../components/match';
import { MOCK_MATCHMAKING } from '../mock';
import type { MatchRunner, MatchTab } from '../mock';
import { colors, spacing } from '../theme';

type MatchScreenProps = {
  activeTab: MatchTab;
};

export function MatchScreen({ activeTab }: MatchScreenProps) {
  const config = MOCK_MATCHMAKING;
  const [lineup, setLineup] = useState<MatchRunner[]>(config.lineup);
  const [available, setAvailable] = useState<MatchRunner[]>(config.available);

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

  if (activeTab === 'solo') {
    return (
      <View style={styles.soloPlaceholder}>
        <Text style={styles.soloTitle}>Solo Matchmaking</Text>
        <Text style={styles.soloText}>1v1 matches are coming soon.</Text>
      </View>
    );
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
          teamLevel={config.teamLevel}
          teamName={config.teamName}
        />
        <MatchDetailsCard matchType={config.matchType} />
        <LineupSection
          lineup={lineup}
          maxLineup={config.maxLineup}
          onRemove={handleRemove}
        />
        <AvailableRunnersSection canAdd={canAdd} onAdd={handleAdd} runners={available} />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FindMatchButton />
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
  soloPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  soloTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  soloText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
