import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AchievementsAllModal,
  AchievementsSection,
  AchievementsSkeleton,
  AllTimeBestsModal,
  CompetitiveHistoryModal,
  CompetitiveHistorySection,
  CompetitiveStatsSection,
  MePillHeader,
  MiniXpBar,
  OverallStatsRangeTabs,
  OverallStatsSection,
  PersonalRecordsSection,
  ProfileHeaderCentered,
  RankProgressCard,
  RankUpCelebrationDrawer,
  SectionHeader,
  StatDetailDrawer,
  TopographyBackground,
  type StatDetailTarget,
} from '../components/me';
import { HeaderIconButton } from '../components/header';
import { useAuth, usePlayerProgress, useUserId, useXpGain } from '../context';
import { useAchievements } from '../hooks/useAchievements';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useFollows } from '../hooks/useFollows';
import { useOtherUserProfile } from '../hooks/useOtherUserProfile';
import { useRankDisplay } from '../hooks/useRankDisplay';
import { MOCK_PROFILE, type OverallStat } from '../mock';
import { performAchievementCardAction } from '../services/achievementCardActions';
import type { AchievementListItem } from '../services/achievementService';
import { sortAchievementsForMeCarousel } from '../services/achievementService';
import { buildOverallStats } from '../services/buildOverallStats';
import { fetchCompetitiveStats, type CompetitiveStats } from '../services/competitiveStatsService';
import type { DistanceMilestoneKey } from '../services/activityStreams';
import { fetchPersonalRecords, type PersonalRecord } from '../services/distanceRecords';
import { fetchRunByActivityId } from '../services/feedService';
import {
  fetchSoloRankPosition,
  fetchSoloRatingHistory,
  type SoloRankPosition,
  type SoloRatingHistoryEntry,
} from '../services/rank';
import type { Run } from '../mock';
import {
  fetchProfileOverallStats,
  rangeSinceDate,
  type OverallStatsRange,
  type ProfileOverallStats,
} from '../services/profileStatsService';
import { colors, spacing } from '../theme';
import { deviceRegionCode } from '../utils/deviceRegion';
import { getErrorMessage } from '../utils/errors';

/** How far the scrollable card's rounded top rides up over the static header. */
const SCROLL_OVERLAP = -8;
/** Low opacity so the artwork reads as a subtle wash behind the header, not a loud graphic. */
const TOPOGRAPHY_OPACITY = 0.16;

type MeTab = 'progress' | 'competitive';

type MeScreenProps = {
  onOpenDevRankMedalMock?: () => void;
  onOpenDevScreenshotMock?: () => void;
  onOpenDevTeamScreenshotMock?: () => void;
  onOpenMatch?: (matchId: string) => void;
  onOpenRun?: (run: Run) => void;
  onOpenSettings?: () => void;
  /**
   * Renders another user's read-only profile instead of the signed-in viewer's
   * own — same layout and sections (topography wash, avatar, solo rank, power
   * rating bar, personal records/overall stats/competitive history), minus
   * bits that only make sense for the viewer's own account: the
   * Progress/Competitive pills, settings cog, mini XP bar, and achievements
   * (no backend support yet for evaluating someone else's achievements).
   * Used by `UserProfileScreen`, which supplies `onBack` for navigation.
   */
  viewedUserId?: string;
  onBack?: () => void;
};

export function MeScreen({
  onOpenDevRankMedalMock,
  onOpenDevScreenshotMock,
  onOpenDevTeamScreenshotMock,
  onOpenMatch,
  onOpenRun,
  onOpenSettings,
  viewedUserId,
  onBack,
}: MeScreenProps) {
  const { gameState } = useAuth();
  const ownUserId = useUserId();
  const isOwnProfile = !viewedUserId || viewedUserId === ownUserId;
  const targetUserId = viewedUserId ?? ownUserId;

  const { level: ownLevel, experience: ownExperience } = usePlayerProgress();
  const { showAchievementUnlocks } = useXpGain();
  const { recordEvent } = useAchievementUnlockPresentation();
  const { profileRank: ownProfileRank } = useRankDisplay();
  const { profile: otherProfile } = useOtherUserProfile(isOwnProfile ? null : targetUserId);
  const { allAchievements, loading, reload } = useAchievements({
    evaluateOnMount: isOwnProfile,
    onUnlock: showAchievementUnlocks,
  });
  const { isFollowing, follow, unfollow } = useFollows();
  const [activeMeTab, setActiveMeTab] = useState<MeTab>('progress');
  const [viewAllVisible, setViewAllVisible] = useState(false);
  const [allTimeBestsVisible, setAllTimeBestsVisible] = useState(false);
  const [allTimeBestsDistanceKey, setAllTimeBestsDistanceKey] = useState<DistanceMilestoneKey | undefined>();
  const [rankUpMockVisible, setRankUpMockVisible] = useState(false);
  const [overallStats, setOverallStats] = useState<ProfileOverallStats | null>(null);
  const [overallStatsRange, setOverallStatsRange] = useState<OverallStatsRange>('all');
  const [competitiveStats, setCompetitiveStats] = useState<CompetitiveStats | null>(null);
  const [ratingHistory, setRatingHistory] = useState<SoloRatingHistoryEntry[]>([]);
  const [competitiveHistoryVisible, setCompetitiveHistoryVisible] = useState(false);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [statDetailTarget, setStatDetailTarget] = useState<StatDetailTarget | null>(null);
  const [soloRankPosition, setSoloRankPosition] = useState<SoloRankPosition | null>(null);
  const [followActionBusy, setFollowActionBusy] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [pillHeaderHeight, setPillHeaderHeight] = useState(0);
  const carouselAchievements = useMemo(
    () => sortAchievementsForMeCarousel(allAchievements),
    [allAchievements],
  );
  // Global solo-leaderboard placement paired with the device-locale region — there's
  // no `profiles.country_code` yet, so this isn't a true per-country rank, and it's
  // the *viewer's* device region regardless of whose profile is shown, so it's only
  // meaningful (and only rendered) on the viewer's own profile. See deviceRegion.ts
  // and soloRankPositionService.ts.
  const regionCode = useMemo(() => deviceRegionCode(), []);

  const profileRank = isOwnProfile ? ownProfileRank : (otherProfile?.rank ?? MOCK_PROFILE.rank);
  const following = !isOwnProfile && !!viewedUserId && isFollowing(viewedUserId);

  useEffect(() => {
    if (!targetUserId) {
      setOverallStats(null);
      return;
    }

    let cancelled = false;

    fetchProfileOverallStats(targetUserId, rangeSinceDate(overallStatsRange))
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
  }, [targetUserId, overallStatsRange]);

  useEffect(() => {
    if (!targetUserId) {
      setCompetitiveStats(null);
      return;
    }

    let cancelled = false;

    fetchCompetitiveStats(targetUserId)
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
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      setRatingHistory([]);
      return;
    }

    let cancelled = false;

    fetchSoloRatingHistory(targetUserId)
      .then((entries) => {
        if (!cancelled) setRatingHistory(entries);
      })
      .catch((error) => {
        console.warn('Failed to load competitive history', error);
        if (!cancelled) setRatingHistory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      setPersonalRecords([]);
      return;
    }

    let cancelled = false;

    fetchPersonalRecords(targetUserId)
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
  }, [targetUserId]);

  useEffect(() => {
    const rating = profileRank.competitiveRating;
    if (rating == null) {
      setSoloRankPosition(null);
      return;
    }

    let cancelled = false;

    fetchSoloRankPosition(rating)
      .then((position) => {
        if (!cancelled) setSoloRankPosition(position);
      })
      .catch((error) => {
        console.warn('Failed to load solo rank position', error);
        if (!cancelled) setSoloRankPosition(null);
      });

    return () => {
      cancelled = true;
    };
  }, [profileRank.competitiveRating]);

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
    name: isOwnProfile ? (gameState?.profile.display_name ?? 'Runner') : (otherProfile?.name ?? 'Runner'),
    avatarUrl: isOwnProfile ? (gameState?.profile.avatar_url ?? undefined) : otherProfile?.avatarUrl,
    level: isOwnProfile ? ownLevel : (otherProfile?.level ?? 0),
    experience: ownExperience,
    rank: profileRank,
  };

  async function handleOpenRun(activityId: string) {
    try {
      const run = await fetchRunByActivityId(activityId, ownUserId);
      if (run) {
        onOpenRun?.(run);
      }
    } catch (error) {
      console.warn('Failed to load run for All-Time Bests row', error);
    }
  }

  async function handleFollow() {
    if (!viewedUserId) return;
    setFollowActionBusy(true);
    try {
      await follow(viewedUserId);
    } catch (error) {
      Alert.alert('Could not follow', getErrorMessage(error, 'Something went wrong.'));
    } finally {
      setFollowActionBusy(false);
    }
  }

  function confirmUnfollow() {
    if (!viewedUserId) return;
    Alert.alert('Unfollow', `Unfollow ${profile.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setFollowActionBusy(true);
            try {
              await unfollow(viewedUserId);
            } catch (error) {
              Alert.alert('Could not unfollow', getErrorMessage(error, 'Something went wrong.'));
            } finally {
              setFollowActionBusy(false);
            }
          })();
        },
      },
    ]);
  }

  function handleOpenProfileMenu() {
    Alert.alert(profile.name, undefined, [
      { text: 'Unfollow', style: 'destructive', onPress: confirmUnfollow },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
        <View onLayout={(event) => setPillHeaderHeight(event.nativeEvent.layout.height)} style={styles.header}>
          <MePillHeader
            activeMode={activeMeTab}
            onBack={isOwnProfile ? undefined : onBack}
            onModeChange={setActiveMeTab}
            onOpenSettings={isOwnProfile ? onOpenSettings : undefined}
            rightAccessory={
              !isOwnProfile && following ? (
                <HeaderIconButton
                  accessibilityLabel="Profile options"
                  icon="ellipsis-vertical"
                  onPress={handleOpenProfileMenu}
                />
              ) : undefined
            }
            showPills={isOwnProfile}
          />
        </View>

        <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)} style={styles.profileGroup}>
          <TopographyBackground color={colors.accentLime} opacity={TOPOGRAPHY_OPACITY} style={styles.topography} />

          <ProfileHeaderCentered
            regionCode={isOwnProfile ? regionCode : null}
            profile={profile}
            soloRankPosition={soloRankPosition}
            topRightSlot={
              isOwnProfile ? (
                <MiniXpBar experience={profile.experience} level={profile.level} />
              ) : following ? (
                <View style={styles.followingBadge}>
                  <Text style={styles.followingBadgeLabel}>Following</Text>
                </View>
              ) : (
                <Pressable
                  accessibilityLabel="Follow"
                  accessibilityRole="button"
                  disabled={followActionBusy}
                  onPress={followActionBusy ? undefined : () => void handleFollow()}
                  style={({ pressed }) => [
                    styles.addFriendButton,
                    followActionBusy && styles.addFriendButtonDisabled,
                    pressed && !followActionBusy && styles.pressed,
                  ]}
                >
                  <Text style={styles.addFriendLabel}>{followActionBusy ? 'Following…' : 'Follow'}</Text>
                </Pressable>
              )
            }
          />

          {isOwnProfile ? <RankProgressCard rank={profileRank} /> : null}
        </View>

        {headerHeight > 0 ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingTop: Math.max(pillHeaderHeight + headerHeight - SCROLL_OVERLAP, 0) },
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
          <View style={styles.scrollCard}>
            {isOwnProfile && activeMeTab === 'progress' ? (
              loading ? (
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
              )
            ) : null}

            {!isOwnProfile || activeMeTab === 'progress' ? (
              <>
                <PersonalRecordsSection
                  onViewAllTimeBests={
                    isOwnProfile
                      ? (distanceKey) => {
                          setAllTimeBestsDistanceKey(distanceKey);
                          setAllTimeBestsVisible(true);
                        }
                      : undefined
                  }
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
            ) : null}

            {!isOwnProfile || activeMeTab === 'competitive' ? (
              <>
                <CompetitiveHistorySection
                  entries={ratingHistory}
                  onOpen={() => setCompetitiveHistoryVisible(true)}
                  viewerAvatarUrl={profile.avatarUrl}
                  viewerRankTierId={profileRank.tierId}
                />
                {competitiveStats ? <CompetitiveStatsSection stats={competitiveStats} /> : null}
              </>
            ) : null}

            {isOwnProfile && onOpenDevRankMedalMock ? (
              <Pressable
                accessibilityLabel="Dev: 3D rank medal"
                accessibilityRole="button"
                onPress={onOpenDevRankMedalMock}
                style={styles.devButton}
              >
                <Text style={styles.devButtonLabel}>DEV: 3D RANK MEDAL</Text>
              </Pressable>
            ) : null}

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

      <CompetitiveHistoryModal
        onClose={() => setCompetitiveHistoryVisible(false)}
        onOpenMatch={onOpenMatch}
        userId={targetUserId}
        viewerAvatarUrl={profile.avatarUrl}
        viewerRankTierId={profileRank.tierId}
        visible={competitiveHistoryVisible}
      />

      <StatDetailDrawer
        onClose={() => setStatDetailTarget(null)}
        range={overallStatsRange}
        target={statDetailTarget}
        userId={targetUserId}
        visible={statDetailTarget != null}
      />

      {__DEV__ && isOwnProfile ? (
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
  header: {
    zIndex: 20,
    elevation: 20,
    backgroundColor: colors.background,
  },
  profileGroup: {
    position: 'relative',
    zIndex: 0,
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  topography: {
    ...StyleSheet.absoluteFill,
  },
  bottomShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 20,
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
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.accentLime,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  addFriendButtonDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  addFriendLabel: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  followingBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accentLime,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  followingBadgeLabel: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
