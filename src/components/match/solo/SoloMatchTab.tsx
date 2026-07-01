import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MOCK_SOLO_MATCHMAKING } from '../../../mock';
import type { TeamMatchFormat } from '../../../mock';
import { useAuth, usePlayerProgress } from '../../../context';
import { useActiveSoloMatch } from '../../../hooks/useActiveSoloMatch';
import { useRankDisplay } from '../../../hooks/useRankDisplay';
import { useSoloMatchmaking } from '../../../hooks/useSoloMatchmaking';
import { fetchSoloMatchType } from '../../../services/matchService';
import { colors, spacing } from '../../../theme';
import { SearchingForOpponentCard } from './SearchingForOpponentCard';
import { SoloMatchActions } from './SoloMatchActions';
import { SoloMatchFormatCard } from './SoloMatchFormatCard';
import { SoloProfileCard } from './SoloProfileCard';
import { SoloSeasonRecordCard } from './SoloSeasonRecordCard';

type SoloMatchTabProps = {
  onViewActiveMatch?: () => void;
};

const DEFAULT_FORMAT: TeamMatchFormat = MOCK_SOLO_MATCHMAKING.matchFormat;

export function SoloMatchTab({ onViewActiveMatch }: SoloMatchTabProps) {
  const soloConfig = MOCK_SOLO_MATCHMAKING;
  const { gameState } = useAuth();
  const { level } = usePlayerProgress();
  const { profileRank, seasonRecord } = useRankDisplay();
  const { match: activeMatch, refresh: refreshActiveMatch } = useActiveSoloMatch();
  const {
    isSearching,
    actionLoading,
    findMatch,
    cancelSearch,
    hasActiveMatch,
    refresh: refreshMatchmaking,
  } = useSoloMatchmaking();
  const [matchFormat, setMatchFormat] = useState<TeamMatchFormat>(DEFAULT_FORMAT);

  useEffect(() => {
    void (async () => {
      try {
        const matchType = await fetchSoloMatchType();
        if (!matchType) {
          return;
        }

        setMatchFormat({
          title: matchType.display_name,
          durationLabel: matchType.duration_label,
          winCondition: matchType.win_condition,
          overview: matchType.overview,
          scoringDetails: matchType.scoring_details,
        });
      } catch {
        // Keep default format when offline.
      }
    })();
  }, []);

  useEffect(() => {
    if (hasActiveMatch) {
      void refreshActiveMatch();
    }
  }, [hasActiveMatch, refreshActiveMatch]);

  async function handleFindMatch() {
    await findMatch();
    await refreshMatchmaking();
    await refreshActiveMatch();
  }

  async function handleCancelSearch() {
    await cancelSearch();
  }

  async function handleViewActiveMatch() {
    await refreshActiveMatch();
    onViewActiveMatch?.();
  }

  const actionStatus = isSearching ? 'searching' : 'idle';
  const showActiveMatchCard = Boolean(activeMatch) || hasActiveMatch;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {showActiveMatchCard ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void handleViewActiveMatch();
            }}
            style={({ pressed }) => [styles.activeMatchCard, pressed && styles.pressed]}
          >
            <Text style={styles.activeMatchEyebrow}>ACTIVE MATCH</Text>
            <Text style={styles.activeMatchTitle}>
              {activeMatch
                ? `View 1v1 match vs ${activeMatch.awayRunner.name}`
                : 'View your active 1v1 match'}
            </Text>
          </Pressable>
        ) : null}

        <SoloProfileCard
          avatarUrl={gameState?.profile.avatar_url ?? soloConfig.avatarUrl}
          level={level}
          name={gameState?.profile.display_name ?? soloConfig.name}
          rankIcon={profileRank.icon}
          rankTitle={profileRank.title}
        />
        {isSearching ? (
          <SearchingForOpponentCard onCancel={() => void handleCancelSearch()} />
        ) : (
          <SoloMatchFormatCard format={matchFormat} />
        )}

        <SoloSeasonRecordCard record={seasonRecord} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <SoloMatchActions
        disabled={actionLoading || hasActiveMatch}
        onChallengeFriend={() => {}}
        onFindMatch={() => {
          void handleFindMatch();
        }}
        status={actionStatus}
      />
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
  activeMatchCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentLime,
    padding: spacing.md,
    gap: 4,
  },
  activeMatchEyebrow: {
    color: colors.accentLime,
    fontSize: 9,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  activeMatchTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
