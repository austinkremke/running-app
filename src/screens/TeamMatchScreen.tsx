import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  TeamChatDrawer,
  TeamMatchActions,
  TeamMatchLiveActivitySection,
  TeamMatchRosters,
  TeamMatchScoreboard,
} from '../components/match/team';
import { useActiveTeamMatch } from '../hooks/useActiveTeamMatch';
import { colors, spacing } from '../theme';

type TeamMatchScreenProps = {
  onRunPress?: () => void;
};

export function TeamMatchScreen({ onRunPress }: TeamMatchScreenProps) {
  const { match, loading, fromServer } = useActiveTeamMatch();
  const [chatVisible, setChatVisible] = useState(false);

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
        <Text style={styles.emptyTitle}>No active team match</Text>
        <Text style={styles.emptyBody}>
          Your team’s next matchup will show up here. Team matchmaking is on the way.
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
        <TeamMatchLiveActivitySection activities={match.activities} />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TeamMatchActions onRun={onRunPress} onTeamChat={() => setChatVisible(true)} />
      <TeamChatDrawer
        matchId={fromServer ? match.id : null}
        onClose={() => setChatVisible(false)}
        subtitle={`${match.homeTeam.name} match thread`}
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
