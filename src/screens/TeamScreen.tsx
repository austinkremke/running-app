import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  InviteToTeamDrawer,
  TeamActivitySection,
  TeamFormDrawer,
  TeamJoinPrompt,
  TeamMembersSection,
  TeamStatsSection,
  TeamTopSection,
  type TeamFormValues,
} from '../components/team';
import { useAuth, useUserId } from '../context';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { useMyTeam } from '../hooks/useMyTeam';
import type { Run, TeamMember, TopTeamListing } from '../mock';
import { fetchFeedPosts } from '../services/feedService';
import {
  createTeam,
  demoteMember,
  disbandTeam,
  kickMember,
  leaveTeam,
  listTopTeams,
  promoteMember,
  transferLeadership,
  updateTeam,
} from '../services/teamService';
import { requestToJoinTeam } from '../services/teamMembershipService';
import { notifyTeamNotificationsChanged } from '../services/teamNotificationBus';
import { registerTeamMenuListener } from '../services/teamMenuBus';
import { colors, spacing } from '../theme';

const TEAM_ACTIVITY_LIMIT = 5;

type TeamScreenProps = {
  onOpenTopTeams?: () => void;
  onOpenRun?: (run: Run) => void;
  onViewAllActivity?: () => void;
};

export function TeamScreen({ onOpenTopTeams, onOpenRun, onViewAllActivity }: TeamScreenProps) {
  const userId = useUserId();
  const { refreshGameState } = useAuth();
  const { runEvaluation } = useAchievementUnlockPresentation();
  const { team, loading, error, refresh } = useMyTeam();
  const createGate = useFeatureGate('create_team');
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const [joinableTeams, setJoinableTeams] = useState<TopTeamListing[]>([]);
  const [joinableLoading, setJoinableLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [requestedTeamIds, setRequestedTeamIds] = useState<Set<string>>(new Set());
  const [teamActivity, setTeamActivity] = useState<Run[]>([]);
  const [teamActivityLoading, setTeamActivityLoading] = useState(false);

  const viewerRole = team?.members.find((member) => member.id === userId)?.role;
  const canManageRoster = viewerRole === 'leader' || viewerRole === 'co-leader';

  useEffect(() => {
    if (loading || team) {
      return;
    }

    let cancelled = false;
    setJoinableLoading(true);

    listTopTeams()
      .then((teams) => {
        if (!cancelled) setJoinableTeams(teams);
      })
      .catch(() => {
        if (!cancelled) setJoinableTeams([]);
      })
      .finally(() => {
        if (!cancelled) setJoinableLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, team]);

  useEffect(() => {
    if (!team || !userId) {
      setTeamActivity([]);
      return;
    }

    let cancelled = false;
    setTeamActivityLoading(true);

    fetchFeedPosts('team', userId, TEAM_ACTIVITY_LIMIT)
      .then((runs) => {
        if (!cancelled) setTeamActivity(runs);
      })
      .catch(() => {
        if (!cancelled) setTeamActivity([]);
      })
      .finally(() => {
        if (!cancelled) setTeamActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [team, userId]);

  async function refreshAll() {
    await refreshGameState();
    await refresh();
  }

  function showError(title: string, caught: unknown, fallback: string) {
    const message = caught instanceof Error ? caught.message : fallback;
    Alert.alert(title, message);
  }

  async function handleRequestToJoin(teamId: string) {
    if (!userId) return;

    setJoiningTeamId(teamId);
    try {
      const status = await requestToJoinTeam(teamId);
      notifyTeamNotificationsChanged();

      if (status === 'joined') {
        // An outstanding invite for this team was auto-accepted.
        await refreshAll();
        await runEvaluation();
      } else {
        setRequestedTeamIds((previous) => new Set(previous).add(teamId));
        Alert.alert('Request sent', 'The team’s leaders will review your request to join.');
      }
    } catch (joinError) {
      showError('Request failed', joinError, 'Could not send your join request.');
    } finally {
      setJoiningTeamId(null);
    }
  }

  async function handleSubmitTeamForm(values: TeamFormValues) {
    setSubmitting(true);
    try {
      if (formMode === 'create') {
        await createTeam({
          name: values.name,
          tag: values.tag,
          motto: values.motto,
          logoIcon: values.logoIcon,
          logoAccent: values.logoAccent,
        });
        await runEvaluation();
      } else if (team) {
        await updateTeam(team.id, {
          name: values.name,
          motto: values.motto,
          logoIcon: values.logoIcon,
          logoAccent: values.logoAccent,
        });
      }
      setFormVisible(false);
      await refreshAll();
    } catch (submitError) {
      showError(
        formMode === 'create' ? 'Create team failed' : 'Update team failed',
        submitError,
        'Something went wrong.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function confirmAction(title: string, message: string, action: () => Promise<void>) {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await action();
              await refreshAll();
            } catch (actionError) {
              showError(title, actionError, 'Something went wrong.');
            }
          })();
        },
      },
    ]);
  }

  function handleMemberOptions(member: TeamMember) {
    const options: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = [];

    if (viewerRole === 'leader') {
      if (member.role === 'co-leader') {
        options.push({
          text: 'Demote to Member',
          onPress: () => confirmAction('Demote member', `Demote ${member.name} to member?`, () => demoteMember(member.id)),
        });
      } else {
        options.push({
          text: 'Promote to Co-Leader',
          onPress: () => confirmAction('Promote member', `Promote ${member.name} to co-leader?`, () => promoteMember(member.id)),
        });
      }
      options.push({
        text: 'Transfer Leadership',
        onPress: () =>
          confirmAction(
            'Transfer leadership',
            `Make ${member.name} the team leader? You will become a co-leader.`,
            () => transferLeadership(member.id),
          ),
      });
    }

    options.push({
      text: 'Remove from Team',
      style: 'destructive',
      onPress: () => confirmAction('Remove member', `Remove ${member.name} from the team?`, () => kickMember(member.id)),
    });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(member.name, undefined, options);
  }

  function handleLeaveTeam() {
    const message =
      viewerRole === 'leader' && (team?.memberCount ?? 0) > 1
        ? 'Leadership will pass to the next member. Leave the team?'
        : 'Are you sure you want to leave the team?';

    confirmAction('Leave team', message, async () => {
      if (userId) {
        await leaveTeam(userId);
      }
    });
  }

  function handleDisbandTeam() {
    confirmAction(
      'Disband team',
      'This permanently deletes the team for every member. Disband?',
      () => disbandTeam(),
    );
  }

  function handleOpenTeamMenu() {
    if (!team) return;

    const canEdit = viewerRole === 'leader' || viewerRole === 'co-leader';
    const isLeader = viewerRole === 'leader';
    const options: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = [];

    if (canEdit) {
      options.push({
        text: 'Edit Team',
        onPress: () => {
          setFormMode('edit');
          setFormVisible(true);
        },
      });
    }

    if (isLeader) {
      options.push({
        text: 'Disband Team',
        style: 'destructive',
        onPress: handleDisbandTeam,
      });
    }

    options.push({
      text: 'Leave Team',
      style: 'destructive',
      onPress: handleLeaveTeam,
    });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(team.name, undefined, options);
  }

  useEffect(() => {
    registerTeamMenuListener(team ? handleOpenTeamMenu : null);
    return () => registerTeamMenuListener(null);
  });

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
    return (
      <>
        <TeamJoinPrompt
          createLockedLabel={createGate.lockedLabel}
          joiningTeamId={joiningTeamId}
          loadingTeams={joinableLoading}
          onCreate={() => {
            setFormMode('create');
            setFormVisible(true);
          }}
          onJoinTeam={(teamId) => void handleRequestToJoin(teamId)}
          requestedTeamIds={requestedTeamIds}
          teams={joinableTeams}
        />
        <TeamFormDrawer
          mode="create"
          onClose={() => setFormVisible(false)}
          onSubmit={(values) => void handleSubmitTeamForm(values)}
          submitting={submitting}
          visible={formVisible && formMode === 'create'}
        />
      </>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <TeamTopSection onRankPress={onOpenTopTeams} team={team} />
        <TeamStatsSection stats={team.stats} />
        <TeamMembersSection
          canManageMember={(member) =>
            member.id !== userId &&
            member.role !== 'leader' &&
            (viewerRole === 'leader' || (viewerRole === 'co-leader' && !member.role))
          }
          memberCount={team.memberCount}
          memberMax={team.memberMax}
          members={team.members}
          onInvitePress={canManageRoster ? () => setInviteVisible(true) : undefined}
          onMemberOptionsPress={canManageRoster ? handleMemberOptions : undefined}
        />
        <TeamActivitySection
          loading={teamActivityLoading}
          onRunPress={onOpenRun}
          onViewAll={onViewAllActivity}
          runs={teamActivity}
        />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TeamFormDrawer
        initialValues={{
          name: team.name,
          tag: team.tag,
          motto: team.motto,
          logoIcon: team.shieldIcon,
          logoAccent: team.shieldAccent,
        }}
        mode="edit"
        onClose={() => setFormVisible(false)}
        onSubmit={(values) => void handleSubmitTeamForm(values)}
        submitting={submitting}
        visible={formVisible && formMode === 'edit'}
      />

      <InviteToTeamDrawer onClose={() => setInviteVisible(false)} visible={inviteVisible} />
    </>
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
