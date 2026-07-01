import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  TeamActivitySection,
  TeamJoinPrompt,
  TeamMembersSection,
  TeamStatsSection,
  TeamTopSection,
} from '../components/team';
import { useAuth, useUserId } from '../context';
import { useMyTeam } from '../hooks/useMyTeam';
import { joinTeam, ROAD_WARRIORS_TEAM_ID } from '../services/teamService';
import { runAchievementEvaluation } from '../services/achievementTriggers';
import { colors, spacing } from '../theme';

type TeamScreenProps = {
  onOpenTopTeams?: () => void;
};

export function TeamScreen({ onOpenTopTeams }: TeamScreenProps) {
  const userId = useUserId();
  const { refreshGameState } = useAuth();
  const { team, loading, error, refresh } = useMyTeam();
  const [joining, setJoining] = useState(false);

  async function handleJoinTeam() {
    if (!userId) return;

    setJoining(true);
    try {
      await joinTeam(userId, ROAD_WARRIORS_TEAM_ID);
      await refreshGameState();
      await refresh();
      await runAchievementEvaluation({ refreshGameState });
    } catch (joinError) {
      const message =
        joinError instanceof Error ? joinError.message : 'Could not join the team.';
      Alert.alert('Join team failed', message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentLime} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!team) {
    return <TeamJoinPrompt joining={joining} onJoin={() => void handleJoinTeam()} />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <TeamTopSection onRankPress={onOpenTopTeams} team={team} />
      <TeamStatsSection stats={team.stats} />
      <TeamMembersSection
        memberCount={team.memberCount}
        memberMax={team.memberMax}
        members={team.members}
      />
      <TeamActivitySection activities={team.activities} />
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  bottomSpacer: {
    height: spacing.md,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  error: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
