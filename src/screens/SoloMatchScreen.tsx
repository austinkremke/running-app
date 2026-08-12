import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { EarlyLeadCard } from '../components/match/EarlyLeadCard';
import {
  SoloActiveMatchActions,
  SoloMatchActivityFeedModal,
  SoloMatchActivitySection,
  SoloMatchChatDrawer,
  SoloMatchOptionsDrawer,
  SoloMatchScoreboard,
  SoloMatchStatsSection,
} from '../components/match/solo';
import { useActiveSoloMatch } from '../hooks/useActiveSoloMatch';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useSoloMatchById } from '../hooks/useSoloMatchById';
import { useAuth, useSoloMatchCompletion } from '../context';
import type { Run } from '../mock';
import { forfeitSoloMatch } from '../services/matchmakingService';
import { registerMatchDetailShareListener } from '../services/matchDetailShareBus';
import { notifyMatchRefresh } from '../services/matchRefreshBus';
import { notifySoloMatchCompletionSync } from '../services/soloMatchCompletionBus';
import { registerSoloMatchMenuListener } from '../services/soloMatchMenuBus';
import { buildMatchShareUrl } from '../services/shareLinks';
import { colors, spacing } from '../theme';

type SoloMatchScreenProps = {
  onRunPress?: () => void;
  onQuit?: () => void;
  onOpenRunDetail?: (run: Run) => void;
  embedded?: boolean;
  /** When set, shows this specific (usually completed) match read-only instead of the viewer's live match. */
  matchId?: string;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function SoloMatchScreen({
  onRunPress,
  onQuit,
  onOpenRunDetail,
  embedded = false,
  matchId,
}: SoloMatchScreenProps) {
  const readOnly = matchId != null;
  const { refreshGameState } = useAuth();
  const liveMatchState = useActiveSoloMatch();
  const detailMatchState = useSoloMatchById(matchId ?? null);
  const { match, loading } = readOnly ? detailMatchState : liveMatchState;
  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (readOnly) {
        await detailMatchState.refresh();
        return;
      }
      await liveMatchState.refresh(options);
    },
    [readOnly, detailMatchState.refresh, liveMatchState.refresh],
  );
  const { syncCompletions } = useSoloMatchCompletion();
  const { recordEvent } = useAchievementUnlockPresentation();
  const [chatVisible, setChatVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [forfeiting, setForfeiting] = useState(false);
  const [activityFeedVisible, setActivityFeedVisible] = useState(false);

  // Only registered for a completed, read-only match — this screen only ever
  // shows a completed match via matchId (reached by tapping a feed card,
  // which only exists once a match is finalized), so sharing is naturally
  // restricted to completed matches without needing an extra status check.
  useEffect(() => {
    if (!readOnly || !match || match.status !== 'completed') {
      registerMatchDetailShareListener(null);
      return () => registerMatchDetailShareListener(null);
    }

    registerMatchDetailShareListener(() => {
      void (async () => {
        try {
          const winner =
            match.homeRunner.totalPoints === match.awayRunner.totalPoints
              ? null
              : match.homeRunner.totalPoints > match.awayRunner.totalPoints
                ? match.homeRunner
                : match.awayRunner;
          const loser = winner === match.homeRunner ? match.awayRunner : match.homeRunner;
          const headline = winner
            ? `${winner.name} Defeated ${loser.name}`
            : `${match.homeRunner.name} Tied ${match.awayRunner.name}`;
          await Share.share({
            message: `${headline} (${match.homeRunner.totalPoints} - ${match.awayRunner.totalPoints})\n${buildMatchShareUrl(match.id)}`,
          });
          await recordEvent('share_feed_post');
        } catch (error) {
          if (error instanceof Error && error.message.includes('User did not share')) {
            return;
          }
          console.warn('Share failed', error);
        }
      })();
    });

    return () => registerMatchDetailShareListener(null);
  }, [match, readOnly, recordEvent]);

  function handleSelectActivity(run: Run | undefined) {
    if (!run) return;
    onOpenRunDetail?.(run);
  }

  useEffect(() => {
    if (readOnly) return;
    void syncCompletions();
  }, [readOnly, syncCompletions]);

  useEffect(() => {
    if (readOnly) return;

    registerSoloMatchMenuListener(() => {
      setOptionsVisible(true);
    });

    return () => {
      registerSoloMatchMenuListener(null);
    };
  }, [readOnly]);

  const confirmQuitMatch = useCallback(() => {
    if (!match || forfeiting) {
      return;
    }

    Alert.alert(
      'Quit match?',
      'You will forfeit this match. It counts as a loss and your rating and season record will update.',
      [
        { text: 'Keep Playing', style: 'cancel' },
        {
          text: 'Quit Match',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setForfeiting(true);
              try {
                const completion = await forfeitSoloMatch(match.id);
                if (completion) {
                  notifySoloMatchCompletionSync([completion]);
                } else {
                  notifySoloMatchCompletionSync();
                }
                notifyMatchRefresh();
                await refreshGameState();
                await syncCompletions();
                onQuit?.();
              } catch (error) {
                Alert.alert('Could not quit match', getErrorMessage(error, 'Please try again.'));
              } finally {
                setForfeiting(false);
                setOptionsVisible(false);
              }
            })();
          },
        },
      ],
    );
  }, [forfeiting, match, onQuit, refreshGameState, syncCompletions]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentLime} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>
          {readOnly ? 'Match not found' : 'No active solo match'}
        </Text>
        <Text style={styles.emptyBody}>
          {readOnly
            ? 'This match could not be loaded.'
            : 'Find a match from the Solo tab to start a ranked duel.'}
        </Text>
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
        <SoloMatchScoreboard
          match={match}
          onMatchExpired={
            readOnly
              ? undefined
              : () => {
                  notifySoloMatchCompletionSync();
                  void refresh({ silent: true });
                }
          }
        />

        <SoloMatchStatsSection match={match} />
        {!readOnly &&
        match.status === 'active' &&
        match.homeRunner.totalPoints === 0 &&
        match.awayRunner.totalPoints === 0 ? (
          <EarlyLeadCard />
        ) : (
          <SoloMatchActivitySection
            activities={match.activities}
            onSelectActivity={(activity) => handleSelectActivity(activity.run)}
            onViewAll={() => setActivityFeedVisible(true)}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!embedded && !readOnly ? (
        <SoloActiveMatchActions onMessage={() => setChatVisible(true)} onRun={onRunPress} />
      ) : null}

      {!readOnly ? (
        <>
          <SoloMatchChatDrawer
            matchId={match.id}
            onClose={() => setChatVisible(false)}
            opponentName={match.awayRunner.name}
            visible={chatVisible}
          />

          <SoloMatchOptionsDrawer
            onClose={() => setOptionsVisible(false)}
            onQuitMatch={() => {
              setOptionsVisible(false);
              confirmQuitMatch();
            }}
            visible={optionsVisible}
          />
        </>
      ) : null}

      <SoloMatchActivityFeedModal
        activities={match.activities}
        onClose={() => setActivityFeedVisible(false)}
        onSelectActivity={(activity) => handleSelectActivity(activity.run)}
        visible={activityFeedVisible}
      />

      {forfeiting ? (
        <View style={styles.forfeitOverlay}>
          <ActivityIndicator color={colors.accentLime} size="large" />
        </View>
      ) : null}
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
    height: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  forfeitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 7, 11, 0.72)',
  },
});
