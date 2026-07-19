import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { useAuth, useSoloMatchCompletion } from '../context';
import type { Run } from '../mock';
import { forfeitSoloMatch } from '../services/matchmakingService';
import { notifyMatchRefresh } from '../services/matchRefreshBus';
import { notifySoloMatchCompletionSync } from '../services/soloMatchCompletionBus';
import { registerSoloMatchMenuListener } from '../services/soloMatchMenuBus';
import { colors, spacing } from '../theme';

type SoloMatchScreenProps = {
  onRunPress?: () => void;
  onQuit?: () => void;
  onOpenRunDetail?: (run: Run) => void;
  embedded?: boolean;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function SoloMatchScreen({ onRunPress, onQuit, onOpenRunDetail, embedded = false }: SoloMatchScreenProps) {
  const { refreshGameState } = useAuth();
  const { match, loading, refresh } = useActiveSoloMatch();
  const { syncCompletions } = useSoloMatchCompletion();
  const [chatVisible, setChatVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [forfeiting, setForfeiting] = useState(false);
  const [activityFeedVisible, setActivityFeedVisible] = useState(false);

  function handleSelectActivity(run: Run | undefined) {
    if (!run) return;
    onOpenRunDetail?.(run);
  }

  useEffect(() => {
    void syncCompletions();
  }, [syncCompletions]);

  useEffect(() => {
    registerSoloMatchMenuListener(() => {
      setOptionsVisible(true);
    });

    return () => {
      registerSoloMatchMenuListener(null);
    };
  }, []);

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
        <Text style={styles.emptyTitle}>No active solo match</Text>
        <Text style={styles.emptyBody}>Find a match from the Solo tab to start a ranked duel.</Text>
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
          onMatchExpired={() => {
            notifySoloMatchCompletionSync();
            void refresh({ silent: true });
          }}
        />

        <SoloMatchStatsSection match={match} />
        <SoloMatchActivitySection
          activities={match.activities}
          onSelectActivity={(activity) => handleSelectActivity(activity.run)}
          onViewAll={() => setActivityFeedVisible(true)}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!embedded ? (
        <SoloActiveMatchActions onMessage={() => setChatVisible(true)} onRun={onRunPress} />
      ) : null}

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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 7, 11, 0.72)',
  },
});
