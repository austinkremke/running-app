import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  SoloActiveMatchActions,
  SoloMatchActivitySection,
  SoloMatchChatDrawer,
  SoloMatchHighlightsRow,
  SoloMatchScoreboard,
  SoloMatchStatsSection,
} from '../components/match/solo';
import { useActiveSoloMatch } from '../hooks/useActiveSoloMatch';
import { useSoloMatchCompletion } from '../context';
import { notifySoloMatchCompletionSync } from '../services/soloMatchCompletionBus';
import { colors, spacing } from '../theme';

type SoloMatchScreenProps = {
  onRunPress?: () => void;
  embedded?: boolean;
};

export function SoloMatchScreen({ onRunPress, embedded = false }: SoloMatchScreenProps) {
  const { match, loading, refresh } = useActiveSoloMatch();
  const { syncCompletions } = useSoloMatchCompletion();
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    void syncCompletions();
  }, [syncCompletions]);

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
        <SoloMatchActivitySection activities={match.activities} />
        <SoloMatchHighlightsRow highlights={match.highlights} />

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
});
