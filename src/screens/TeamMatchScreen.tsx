import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { EarlyLeadCard } from '../components/match/EarlyLeadCard';
import {
  TeamChatDrawer,
  TeamMatchActions,
  TeamMatchActivityFeedModal,
  TeamMatchLiveActivitySection,
  TeamMatchRosters,
  TeamMatchScoreboard,
} from '../components/match/team';
import { useActiveTeamMatch } from '../hooks/useActiveTeamMatch';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useTeamMatchById } from '../hooks/useTeamMatchById';
import type { Run } from '../mock';
import { registerMatchDetailShareListener } from '../services/matchDetailShareBus';
import { buildMatchShareUrl } from '../services/shareLinks';
import { colors, spacing } from '../theme';

type TeamMatchScreenProps = {
  onRunPress?: () => void;
  onOpenRunDetail?: (run: Run) => void;
  /** When set, shows this specific (usually completed) match read-only instead of the viewer's live match. */
  matchId?: string;
};

export function TeamMatchScreen({ onRunPress, onOpenRunDetail, matchId }: TeamMatchScreenProps) {
  const readOnly = matchId != null;
  const liveMatchState = useActiveTeamMatch();
  const detailMatchState = useTeamMatchById(matchId ?? null);
  const { match, loading, fromServer } = readOnly
    ? { ...detailMatchState, fromServer: true }
    : liveMatchState;
  const [chatVisible, setChatVisible] = useState(false);
  const [activityFeedVisible, setActivityFeedVisible] = useState(false);
  const { recordEvent } = useAchievementUnlockPresentation();

  function handleSelectActivity(run: Run | undefined) {
    if (!run) return;
    onOpenRunDetail?.(run);
  }

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
            match.homeTeam.totalPoints === match.awayTeam.totalPoints
              ? null
              : match.homeTeam.totalPoints > match.awayTeam.totalPoints
                ? match.homeTeam
                : match.awayTeam;
          const loser = winner === match.homeTeam ? match.awayTeam : match.homeTeam;
          const headline = winner
            ? `${winner.name} Defeated ${loser.name}`
            : `${match.homeTeam.name} Tied ${match.awayTeam.name}`;
          await Share.share({
            message: `${headline} (${match.homeTeam.totalPoints} - ${match.awayTeam.totalPoints})\n${buildMatchShareUrl(match.id)}`,
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
          {readOnly ? 'Match not found' : 'No active team match'}
        </Text>
        <Text style={styles.emptyBody}>
          {readOnly
            ? 'This match could not be loaded.'
            : 'Your team’s next matchup will show up here. Team matchmaking is on the way.'}
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
        <View style={styles.matchTop}>
          <TeamMatchScoreboard match={match} />
          <TeamMatchRosters awayTeam={match.awayTeam} homeTeam={match.homeTeam} />
        </View>
        {!readOnly &&
        match.status === 'active' &&
        match.homeTeam.totalPoints === 0 &&
        match.awayTeam.totalPoints === 0 ? (
          <EarlyLeadCard />
        ) : (
          <TeamMatchLiveActivitySection
            activities={match.activities}
            onSelectActivity={(activity) => handleSelectActivity(activity.run)}
            onViewAll={() => setActivityFeedVisible(true)}
          />
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!readOnly ? (
        <>
          <TeamMatchActions onRun={onRunPress} onTeamChat={() => setChatVisible(true)} />
          <TeamChatDrawer
            matchId={fromServer ? match.id : null}
            onClose={() => setChatVisible(false)}
            subtitle={`${match.homeTeam.name} match thread`}
            visible={chatVisible}
          />
        </>
      ) : null}
      <TeamMatchActivityFeedModal
        activities={match.activities}
        onClose={() => setActivityFeedVisible(false)}
        onSelectActivity={(activity) => handleSelectActivity(activity.run)}
        visible={activityFeedVisible}
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
  matchTop: {
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  emptyBody: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
