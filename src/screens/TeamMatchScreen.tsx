import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  TeamChatDrawer,
  TeamMatchActions,
  TeamMatchActivityFeedModal,
  TeamMatchLiveActivitySection,
  TeamMatchRosters,
  TeamMatchScoreboard,
} from '../components/match/team';
import { useActiveTeamMatch } from '../hooks/useActiveTeamMatch';
import { useTeamMatchById } from '../hooks/useTeamMatchById';
import type { Run } from '../mock';
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

  function handleSelectActivity(run: Run | undefined) {
    if (!run) return;
    onOpenRunDetail?.(run);
  }

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
        <TeamMatchLiveActivitySection
          activities={match.activities}
          onSelectActivity={(activity) => handleSelectActivity(activity.run)}
          onViewAll={() => setActivityFeedVisible(true)}
        />
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
