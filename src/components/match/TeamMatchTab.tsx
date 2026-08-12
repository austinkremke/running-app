import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TeamMatchFormat } from '../../mock';
import { useUserId } from '../../context';
import { useActiveTeamMatch } from '../../hooks/useActiveTeamMatch';
import { useMyTeam } from '../../hooks/useMyTeam';
import { useTeamMatchmaking } from '../../hooks/useTeamMatchmaking';
import { fetchTeamMatchType } from '../../services/matchService';
import { colors, spacing } from '../../theme';
import { FindMatchButton } from './FindMatchButton';
import { MatchFormatCard } from './MatchFormatCard';
import { MatchTeamSummaryCard } from './MatchTeamSummaryCard';
import { SearchingForTeamCard } from './SearchingForTeamCard';
import { TeamMatchPreviewCard } from './team/TeamMatchPreviewCard';

type TeamMatchTabProps = {
  onViewActiveMatch?: () => void;
};

// TEMP (dev testing only): lowered from 2 to 1 to match the paired temporary
// server-side override (20250706000001_temp_team_min_roster_1.sql) so a
// solo-member team can queue for testing on a second device. Revert both
// together — see milestones/07-team-play.md open decisions for the real rule.
const MIN_ROSTER = 1;

export function TeamMatchTab({ onViewActiveMatch }: TeamMatchTabProps) {
  const userId = useUserId();
  const { team, loading: teamLoading } = useMyTeam();
  const {
    status,
    isSearching,
    actionLoading,
    hasActiveMatch,
    findMatch,
    cancelSearch,
    refresh,
    error,
  } = useTeamMatchmaking();
  const { match: activeMatch } = useActiveTeamMatch();
  const [matchFormat, setMatchFormat] = useState<TeamMatchFormat | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const matchType = await fetchTeamMatchType();
        if (!matchType) return;
        setMatchFormat({
          title: matchType.display_name,
          durationLabel: matchType.duration_label,
          winCondition: matchType.win_condition,
          overview: matchType.overview,
          scoringDetails: matchType.scoring_details,
        });
      } catch {
        // Keep null format when offline; format card is hidden.
      }
    })();
  }, []);

  async function handleFindMatch() {
    await findMatch();
    await refresh();
  }

  if (teamLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentLime} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Join a team to compete</Text>
        <Text style={styles.emptyBody}>
          Team matchmaking unlocks once you’re on a squad. Head to the Team tab to join or create
          one.
        </Text>
      </View>
    );
  }

  const viewerRole = team.members.find((member) => member.id === userId)?.role;
  const canQueue = viewerRole === 'leader' || viewerRole === 'co-leader';
  const roster = team.memberCount;
  const rosterTooSmall = roster < MIN_ROSTER;
  const showActiveMatchButton = hasActiveMatch || status.status === 'in_match';
  const findDisabled =
    actionLoading || isSearching || rosterTooSmall || showActiveMatchButton || !canQueue;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <MatchTeamSummaryCard
          logoUrl={team.logoUrl}
          powerRating={team.competitiveRating}
          rankPosition={team.teamRank.rank}
          rankTierId={team.teamRank.tierId}
          shieldAccent={team.shieldAccent}
          shieldIcon={team.shieldIcon}
          wins={team.seasonWins}
        />

        {showActiveMatchButton && activeMatch ? (
          <TeamMatchPreviewCard match={activeMatch} onPress={onViewActiveMatch} />
        ) : null}

        {isSearching ? (
          <SearchingForTeamCard onCancel={() => void cancelSearch()} />
        ) : matchFormat ? (
          <MatchFormatCard format={matchFormat} />
        ) : null}

        {rosterTooSmall && !showActiveMatchButton ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Your team needs at least {MIN_ROSTER} members to find a match.
            </Text>
          </View>
        ) : null}

        {!canQueue && !rosterTooSmall && !showActiveMatchButton ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Only your team leader or a co-leader can start a match.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!showActiveMatchButton ? (
        <FindMatchButton disabled={findDisabled} onPress={() => void handleFindMatch()} />
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
    height: spacing.md,
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
  notice: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
