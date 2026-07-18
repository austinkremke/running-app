import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AchievementsAllModal,
  AchievementsSection,
  AchievementsSkeleton,
  CompetitiveStatsSection,
  ExperienceCard,
  OverallStatsRangeTabs,
  OverallStatsSection,
  ProfileTopSection,
  RankUpCelebrationDrawer,
  SectionHeader,
  StatDetailDrawer,
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
import {
  fetchProfileOverallStats,
  rangeSinceDate,
  type OverallStatsRange,
  type ProfileOverallStats,
} from '../services/profileStatsService';
import { fetchTeamNameById } from '../services/teamService';
import { colors, spacing } from '../theme';

type MeScreenProps = {
  onOpenDevScreenshotMock?: () => void;
  onOpenDevTeamScreenshotMock?: () => void;
  onOpenSettings?: () => void;
};

export function MeScreen({
  onOpenDevScreenshotMock,
  onOpenDevTeamScreenshotMock,
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
  const [viewAllVisible, setViewAllVisible] = useState(false);
  const [rankUpMockVisible, setRankUpMockVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [overallStats, setOverallStats] = useState<ProfileOverallStats | null>(null);
  const [overallStatsRange, setOverallStatsRange] = useState<OverallStatsRange>('all');
  const [competitiveStats, setCompetitiveStats] = useState<CompetitiveStats | null>(null);
  const [statDetailTarget, setStatDetailTarget] = useState<StatDetailTarget | null>(null);
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.profileGroup}>
          <ProfileTopSection onEditAvatar={onOpenSettings} profile={profile} />
          <ExperienceCard experience={profile.experience} />
        </View>

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

        {overallStats ? (
          <OverallStatsSection
            headerAccessory={
              <OverallStatsRangeTabs onChange={setOverallStatsRange} value={overallStatsRange} />
            }
            onStatPress={handleStatPress}
            stats={buildOverallStats(overallStats)}
          />
        ) : null}

        {competitiveStats ? <CompetitiveStatsSection stats={competitiveStats} /> : null}

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
      </ScrollView>

      <AchievementsAllModal
        achievements={allAchievements}
        onAchievementPress={handleAchievementPress}
        onClose={() => setViewAllVisible(false)}
        visible={viewAllVisible}
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
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  profileGroup: {
    gap: spacing.md,
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
