import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AchievementsAllModal,
  AchievementsSection,
  AchievementsSkeleton,
  ExperienceCard,
  OverallStatsSection,
  ProfileTopSection,
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
import { formatDurationClock, formatPace } from '../services/distanceService';
import {
  fetchProfileOverallStats,
  type ProfileOverallStats,
} from '../services/profileStatsService';
import { fetchTeamNameById } from '../services/teamService';
import { OnboardingTutorialScreen } from './onboarding';
import { colors, spacing } from '../theme';

function buildOverallStats(
  stats: ProfileOverallStats,
  seasonRecord: { wins: number; losses: number },
): OverallStat[] {
  return [
    {
      id: 'stat-distance',
      icon: 'footsteps-outline',
      iconColor: colors.accentLime,
      value: stats.totalDistanceMiles.toFixed(1),
      unit: 'mi',
      label: 'Total Distance',
      layout: 'grid',
      metricKey: 'distance',
    },
    {
      id: 'stat-calories',
      icon: 'flame',
      iconColor: '#FF8A3D',
      value: stats.totalCalories.toLocaleString(),
      unit: 'cal',
      label: 'Calories Burned',
      layout: 'grid',
      metricKey: 'calories',
    },
    {
      id: 'stat-time',
      icon: 'stopwatch-outline',
      iconColor: colors.accentLime,
      value: formatDurationClock(stats.totalDurationSeconds),
      unit: 'hr',
      label: 'Total Time',
      layout: 'grid',
      metricKey: 'time',
    },
    {
      id: 'stat-pace',
      icon: 'speedometer-outline',
      iconColor: colors.accentLime,
      value: stats.avgPaceSecondsPerMile > 0 ? formatPace(stats.avgPaceSecondsPerMile) : '--',
      unit: 'min/mi',
      label: 'Avg Pace',
      layout: 'grid',
      metricKey: 'pace',
    },
    {
      id: 'stat-elevation',
      icon: 'trending-up',
      iconColor: colors.accentLime,
      value: stats.totalElevationGainFt.toLocaleString(),
      unit: 'ft',
      label: 'Elevation Gain',
      layout: 'grid',
      metricKey: 'elevation',
    },
    {
      id: 'stat-runs',
      icon: 'footsteps',
      iconColor: colors.accentLime,
      value: String(stats.totalRuns),
      label: 'Total Runs',
      layout: 'grid',
      metricKey: 'runs',
    },
    {
      id: 'stat-record',
      icon: 'trophy',
      iconColor: colors.accentLime,
      value: String(seasonRecord.wins),
      label: 'Match Wins',
      sublabel: `${seasonRecord.wins} - ${seasonRecord.losses} Record`,
      layout: 'wide',
    },
  ];
}

type MeScreenProps = {
  onOpenSettings?: () => void;
};

export function MeScreen({ onOpenSettings }: MeScreenProps) {
  const { gameState } = useAuth();
  const userId = useUserId();
  const { level, experience } = usePlayerProgress();
  const { showAchievementUnlocks } = useXpGain();
  const { recordEvent } = useAchievementUnlockPresentation();
  const { profileRank, seasonRecord } = useRankDisplay();
  const { allAchievements, loading, reload } = useAchievements({
    evaluateOnMount: true,
    onUnlock: showAchievementUnlocks,
  });
  const [viewAllVisible, setViewAllVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [overallStats, setOverallStats] = useState<ProfileOverallStats | null>(null);
  const [statDetailTarget, setStatDetailTarget] = useState<StatDetailTarget | null>(null);
  const [tutorialPreviewVisible, setTutorialPreviewVisible] = useState(false);
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

    fetchProfileOverallStats(userId)
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
      lifetimeValue: stat.unit ? `${stat.value} ${stat.unit}` : stat.value,
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
            onStatPress={handleStatPress}
            stats={buildOverallStats(overallStats, seasonRecord)}
          />
        ) : null}

        <Pressable
          accessibilityLabel="Preview the onboarding tutorial"
          accessibilityRole="button"
          onPress={() => setTutorialPreviewVisible(true)}
          style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}
        >
          <Text style={styles.previewButtonLabel}>Preview Onboarding Tutorial</Text>
        </Pressable>

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
        target={statDetailTarget}
        userId={userId}
        visible={statDetailTarget != null}
      />

      <Modal
        animationType="slide"
        onRequestClose={() => setTutorialPreviewVisible(false)}
        visible={tutorialPreviewVisible}
      >
        <OnboardingTutorialScreen
          onFindFirstMatch={() => setTutorialPreviewVisible(false)}
          onMaybeLater={() => setTutorialPreviewVisible(false)}
          onSkip={() => setTutorialPreviewVisible(false)}
          previewMode
        />
      </Modal>
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
  previewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  previewButtonPressed: {
    opacity: 0.75,
  },
  previewButtonLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  bottomSpacer: {
    height: spacing.md,
  },
});
