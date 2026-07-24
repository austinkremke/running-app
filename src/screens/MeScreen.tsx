import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AchievementsAllModal,
  AchievementsSection,
  AchievementsSkeleton,
  AllTimeBestsModal,
  CompetitiveStatsSection,
  ExperienceCard,
  MeTabs,
  OverallStatsRangeTabs,
  OverallStatsSection,
  PersonalRecordsSection,
  ProfileTopSection,
  RankSummaryCard,
  RankUpCelebrationDrawer,
  SectionHeader,
  StatDetailDrawer,
  type MeTab,
  type StatDetailTarget,
} from '../components/me';
import { useAuth, usePlayerProgress, useUserId, useXpGain } from '../context';
import { useAchievements } from '../hooks/useAchievements';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useRankDisplay } from '../hooks/useRankDisplay';
import type { OverallStat } from '../mock';
import { performAchievementCardAction } from '../services/achievementCardActions';
import type { AchievementListItem } from '../services/achievementService';
import { sortAchievementsForMeCarousel } from '../services/achievementService';
import { buildOverallStats } from '../services/buildOverallStats';
import { fetchCompetitiveStats, type CompetitiveStats } from '../services/competitiveStatsService';
import type { DistanceMilestoneKey } from '../services/activityStreams';
import { fetchPersonalRecords, type PersonalRecord } from '../services/distanceRecords';
import { fetchRunByActivityId } from '../services/feedService';
import type { Run } from '../mock';
import {
  fetchProfileOverallStats,
  rangeSinceDate,
  type OverallStatsRange,
  type ProfileOverallStats,
} from '../services/profileStatsService';
import { fetchTeamNameById } from '../services/teamService';
import { colors, spacing } from '../theme';

/** How far the scrollable card's rounded top rides up over the static header. */
const SCROLL_OVERLAP = -8;

type MeScreenProps = {
  onOpenDevScreenshotMock?: () => void;
  onOpenDevTeamScreenshotMock?: () => void;
  onOpenRun?: (run: Run) => void;
  onOpenSettings?: () => void;
};

export function MeScreen({
  onOpenDevScreenshotMock,
  onOpenDevTeamScreenshotMock,
  onOpenRun,
  onOpenSettings,
}: MeScreenProps) {
  const { gameState } = useAuth();
  const userId = useUserId();
  const { level, experience } = usePlayerProgress();
  const { showAchievementUnlocks } = useXpGain();
  const { recordEvent } = useAchievementUnlockPresentation();
  const { profileRank } = useRankDisplay();
  const { allAchievements, loading, reload } = useAchievements({
    evaluateOnMount: true,
    onUnlock: showAchievementUnlocks,
  });
  const [activeMeTab, setActiveMeTab] = useState<MeTab>('progress');
  const [viewAllVisible, setViewAllVisible] = useState(false);
  const [allTimeBestsVisible, setAllTimeBestsVisible] = useState(false);
  const [allTimeBestsDistanceKey, setAllTimeBestsDistanceKey] = useState<DistanceMilestoneKey | undefined>();
  const [rankUpMockVisible, setRankUpMockVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [overallStats, setOverallStats] = useState<ProfileOverallStats | null>(null);
  const [overallStatsRange, setOverallStatsRange] = useState<OverallStatsRange>('all');
  const [competitiveStats, setCompetitiveStats] = useState<CompetitiveStats | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [statDetailTarget, setStatDetailTarget] = useState<StatDetailTarget | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const carouselAchievements = useMemo(
    () => sortAchievementsForMeCarousel(allAchievements),
    [allAchievements],
  );

  const teamId = gameState?.profile.team_id ?? null;

  useEffect(() => {
    if (!userId) {
      setOverallStats(null);
      return;
    }

    let cancelled = false;

    fetchProfileOverallStats(userId, rangeSinceDate(overallStatsRange))
      .then((stats) => {
        if (!cancelled) setOverallStats(stats);
      })
      .catch((error) => {
        console.warn('Failed to load overall stats', error);
        if (!cancelled) setOverallStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, overallStatsRange]);

  useEffect(() => {
    if (!userId) {
      setCompetitiveStats(null);
      return;
    }

    let cancelled = false;

    fetchCompetitiveStats(userId)
      .then((stats) => {
        if (!cancelled) setCompetitiveStats(stats);
      })
      .catch((error) => {
        console.warn('Failed to load competitive stats', error);
        if (!cancelled) setCompetitiveStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setPersonalRecords([]);
      return;
    }

    let cancelled = false;

    fetchPersonalRecords(userId)
      .then((records) => {
        if (!cancelled) setPersonalRecords(records);
      })
      .catch((error) => {
        console.warn('Failed to load personal records', error);
        if (!cancelled) setPersonalRecords([]);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!teamId) {
      setTeamName('');
      return;
    }

    let cancelled = false;

    fetchTeamNameById(teamId)
      .then((name) => {
        if (!cancelled) setTeamName(name ?? '');
      })
      .catch(() => {
        if (!cancelled) setTeamName('');
      });

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const handleAchievementPress = useCallback(
    async (achievement: AchievementListItem) => {
      try {
        const unlocks = await performAchievementCardAction(achievement.id, recordEvent);
        if (unlocks.length > 0) {
          await reload();
        }
      } catch (error) {
        console.warn('Achievement card action failed', error);
      }
    },
    [recordEvent, reload],
  );

  const profile = {
    name: gameState?.profile.display_name ?? 'Runner',
    avatarUrl: gameState?.profile.avatar_url ?? undefined,
    clanName: teamName,
    level,
    experience,
    rank: profileRank,
  };

  async function handleOpenRun(activityId: string) {
    try {
      const run = await fetchRunByActivityId(activityId, userId);
      if (run) {
        onOpenRun?.(run);
      }
    } catch (error) {
      console.warn('Failed to load run for All-Time Bests row', error);
    }
  }

  function handleStatPress(stat: OverallStat) {
    if (!stat.metricKey) return;
    setStatDetailTarget({
      metricKey: stat.metricKey,
      label: stat.label,
      icon: stat.icon,
      iconColor: stat.iconColor,
      currentValue: stat.unit ? `${stat.value} ${stat.unit}` : stat.value,
    });
  }

  return (
    <>
      <View style={styles.container}>
        <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)} style={styles.profileGroup}>
          <ProfileTopSection profile={profile} />
          <ExperienceCard experience={profile.experience} />
        </View>

        {headerHeight > 0 ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingTop: Math.max(headerHeight - SCROLL_OVERLAP, 0) },
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
          <View style={styles.scrollCard}>
            <MeTabs onChange={setActiveMeTab} value={activeMeTab} />

            {activeMeTab === 'progress' ? (
              <>
                {loading ? (
                  <AchievementsSkeleton />
                ) : carouselAchievements.length > 0 ? (
                  <AchievementsSection
                    achievements={carouselAchievements}
                    onAchievementPress={handleAchievementPress}
                    onViewAll={() => setViewAllVisible(true)}
                  />
                ) : (
                  <View style={styles.emptyAchievements}>
                    <SectionHeader
                      actionLabel="VIEW ALL"
                      onActionPress={() => setViewAllVisible(true)}
                      title="ACHIEVEMENTS"
                    />
                    <Text style={styles.emptyCopy}>Complete your first run to start earning badges.</Text>
                  </View>
                )}

                <PersonalRecordsSection
                  onViewAllTimeBests={(distanceKey) => {
                    setAllTimeBestsDistanceKey(distanceKey);
                    setAllTimeBestsVisible(true);
                  }}
                  records={personalRecords}
                />

                {overallStats ? (
                  <OverallStatsSection
                    headerAccessory={
                      <OverallStatsRangeTabs onChange={setOverallStatsRange} value={overallStatsRange} />
                    }
                    onStatPress={handleStatPress}
                    stats={buildOverallStats(overallStats)}
                  />
                ) : null}
              </>
            ) : (
              <>
                <RankSummaryCard rank={profileRank} />
                {competitiveStats ? <CompetitiveStatsSection stats={competitiveStats} /> : null}
              </>
            )}

            {/* Dev-only screenshot mockup buttons — commented out for now, not removed.
            {onOpenDevScreenshotMock ? (
              <Pressable
                accessibilityLabel="Dev: 1v1 screenshot mockup"
                accessibilityRole="button"
                onPress={onOpenDevScreenshotMock}
                style={styles.devButton}
              >
                <Text style={styles.devButtonLabel}>DEV: 1V1 SCREENSHOT MOCKUP</Text>
              </Pressable>
            ) : null}

            {__DEV__ ? (
              <Pressable
                accessibilityLabel="Dev: rank up screenshot mockup"
                accessibilityRole="button"
                onPress={() => setRankUpMockVisible(true)}
                style={styles.devButton}
              >
                <Text style={styles.devButtonLabel}>DEV: RANK UP SCREENSHOT MOCKUP</Text>
              </Pressable>
            ) : null}

            {onOpenDevTeamScreenshotMock ? (
              <Pressable
                accessibilityLabel="Dev: team screenshot mockup"
                accessibilityRole="button"
                onPress={onOpenDevTeamScreenshotMock}
                style={styles.devButton}
              >
                <Text style={styles.devButtonLabel}>DEV: TEAM SCREENSHOT MOCKUP</Text>
              </Pressable>
            ) : null}
            */}

            <View style={styles.bottomSpacer} />
          </View>
          </ScrollView>
        ) : null}
      </View>

      <AchievementsAllModal
        achievements={allAchievements}
        onAchievementPress={handleAchievementPress}
        onClose={() => setViewAllVisible(false)}
        visible={viewAllVisible}
      />

      <AllTimeBestsModal
        initialDistanceKey={allTimeBestsDistanceKey}
        onClose={() => setAllTimeBestsVisible(false)}
        onOpenRun={onOpenRun ? (activityId) => void handleOpenRun(activityId) : undefined}
        visible={allTimeBestsVisible}
      />

      <StatDetailDrawer
        onClose={() => setStatDetailTarget(null)}
        range={overallStatsRange}
        target={statDetailTarget}
        userId={userId}
        visible={statDetailTarget != null}
      />

      {__DEV__ ? (
        <RankUpCelebrationDrawer
          fromTierId="silver"
          onClose={() => setRankUpMockVisible(false)}
          toTierId="gold"
          visible={rankUpMockVisible}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  content: {
    flexGrow: 1,
  },
  profileGroup: {
    zIndex: 0,
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  scrollCard: {
    flexGrow: 1,
    gap: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
  },
  emptyAchievements: {
    gap: spacing.xs,
  },
  emptyCopy: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: spacing.md,
  },
  devButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  devButtonLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
