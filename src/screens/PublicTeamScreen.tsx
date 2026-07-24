import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TeamMembersSection, TeamStatsSection, TeamTopSection } from '../components/team';
import { HeaderIconButton } from '../components/header';
import type { Team } from '../mock';
import { fetchTeamById } from '../services/teamService';
import { colors, spacing } from '../theme';

type PublicTeamScreenProps = {
  teamId: string;
  onBack?: () => void;
  onOpenProfile?: (userId: string) => void;
};

/** Read-only view of another team — same layout as the Team tab, minus recent
 * activity (member-gated data the viewer can't see anyway) and any
 * member/admin-only actions (invite, roster management, edit/disband/leave). */
export function PublicTeamScreen({ teamId, onBack, onOpenProfile }: PublicTeamScreenProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTeamById(teamId)
      .then((result) => {
        if (!cancelled) setTeam(result);
      })
      .catch(() => {
        if (!cancelled) setTeam(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <HeaderIconButton accessibilityLabel="Go back" icon="chevron-back" onPress={onBack} />
        <Text numberOfLines={1} style={styles.headerTitle}>
          {team?.name ?? 'Team'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentLime} />
        </View>
      ) : team ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <TeamTopSection team={team} />
          <TeamStatsSection stats={team.stats} />
          <TeamMembersSection
            memberCount={team.memberCount}
            memberMax={team.memberMax}
            members={team.members}
            onOpenProfile={onOpenProfile ? (member) => onOpenProfile(member.id) : undefined}
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={styles.errorText}>Couldn't load this team.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 40,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  bottomSpacer: {
    height: spacing.md,
  },
});
