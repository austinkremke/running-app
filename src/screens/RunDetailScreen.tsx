import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FullscreenRouteMap } from '../components/map';
import {
  ClimbingAnalysisCard,
  HeartRateAnalysisCard,
  MileSplitsSection,
  PaceDistributionCard,
  PostRunChartSection,
  PostRunPrimaryStats,
} from '../components/post-run';
import { FeedCommentsDrawer, RunCardEngagement, RunMediaCarousel } from '../components/feed';
import { HeaderIconButton } from '../components/header';
import { useUserId } from '../context';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import type { Run } from '../mock';
import {
  deleteActivity,
  fetchRunExtras,
  type RunExtras,
} from '../services/activityDetailService';
import { fetchActivityTrack } from '../services/activityTrackService';
import { buildClimbingAnalysis } from '../services/climbingAnalysisService';
import { buildHeartRateAnalysis } from '../services/heartRateAnalysisService';
import { buildPaceDistribution } from '../services/paceDistributionService';
import { getPaceProfile } from '../services/paceProfileService';
import { toggleFeedLike } from '../services/feedEngagementService';
import { buildRunShareUrl } from '../services/shareLinks';
import { colors, spacing } from '../theme';
import type { ClimbingAnalysisResult } from '../types/climbingAnalysis';
import type { HeartRateAnalysisResult } from '../types/heartRateAnalysis';
import type { PaceDistributionResult } from '../types/paceAnalysis';

type RunDetailScreenProps = {
  run: Run;
  onBack?: () => void;
  onDeleted?: () => void;
};

export function RunDetailScreen({ run, onBack, onDeleted }: RunDetailScreenProps) {
  const viewerId = useUserId();
  const { recordEvent } = useAchievementUnlockPresentation();
  const [extras, setExtras] = useState<RunExtras | null>(null);
  const [paceDistribution, setPaceDistribution] = useState<PaceDistributionResult | null>(null);
  const [climbingAnalysis, setClimbingAnalysis] = useState<ClimbingAnalysisResult | null>(null);
  const [heartRateAnalysis, setHeartRateAnalysis] = useState<HeartRateAnalysisResult | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [liked, setLiked] = useState(run.likedByMe);
  const [likes, setLikes] = useState(run.likes);
  const [comments, setComments] = useState(run.comments);

  useEffect(() => {
    let cancelled = false;
    fetchRunExtras(run.id)
      .then((next) => {
        if (!cancelled) setExtras(next);
      })
      .catch(() => {
        if (!cancelled) setExtras(null);
      });
    return () => {
      cancelled = true;
    };
  }, [run.id]);

  const summary = extras?.summary ?? null;
  const isOwner = Boolean(viewerId && extras && viewerId === extras.activityUserId);

  useEffect(() => {
    if (!isOwner || !extras?.trackStoragePath || !viewerId) {
      setPaceDistribution(null);
      setClimbingAnalysis(null);
      setHeartRateAnalysis(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [records, profile] = await Promise.all([
          fetchActivityTrack(extras.trackStoragePath),
          getPaceProfile(viewerId),
        ]);
        if (cancelled) return;
        setPaceDistribution(buildPaceDistribution(records, profile));
        setClimbingAnalysis(buildClimbingAnalysis(records, profile));
        setHeartRateAnalysis(buildHeartRateAnalysis(records));
      } catch (error) {
        console.warn('[RunDetailScreen] premium analytics failed', error);
        if (!cancelled) {
          setPaceDistribution(null);
          setClimbingAnalysis(null);
          setHeartRateAnalysis(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOwner, extras?.trackStoragePath, viewerId]);

  const primaryStats = summary
    ? [
        { label: 'DISTANCE', value: summary.distanceMiles.toFixed(2), unit: 'mi' },
        { label: 'TIME', value: summary.duration, unit: summary.durationUnit },
        { label: 'AVG PACE', value: summary.avgPace, unit: summary.avgPaceUnit },
        { label: 'CALORIES', value: String(summary.calories), unit: summary.caloriesUnit },
        {
          label: 'AVG HR',
          value: summary.avgHeartRate > 0 ? String(summary.avgHeartRate) : '—',
          unit: summary.avgHeartRate > 0 ? summary.avgHeartRateUnit : '',
        },
        { label: 'ELEV GAIN', value: String(summary.elevationGain), unit: summary.elevationGainUnit },
      ]
    : [
        { label: 'DISTANCE', value: run.stats.distanceMiles.toFixed(2), unit: 'mi' },
        { label: 'TIME', value: run.stats.duration, unit: run.stats.durationUnit ?? '' },
        { label: 'AVG PACE', value: run.stats.pacePerMile, unit: '/mi' },
      ];

  async function handleToggleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((count) => count + (nextLiked ? 1 : -1));
    try {
      await toggleFeedLike(run.id, nextLiked);
    } catch {
      setLiked(!nextLiked);
      setLikes((count) => count + (nextLiked ? -1 : 1));
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `${run.user.name} ran ${run.stats.distanceMiles.toFixed(1)} mi — ${run.title}\n${buildRunShareUrl(run.id)}`,
      });
      await recordEvent('share_feed_post');
    } catch (error) {
      if (error instanceof Error && error.message.includes('User did not share')) {
        return;
      }
      console.warn('Share failed', error);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete run', 'This permanently deletes this run and its feed post.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!extras) return;
            setDeleting(true);
            try {
              await deleteActivity(extras.activityId);
              onDeleted?.();
            } catch (error) {
              Alert.alert('Delete failed', error instanceof Error ? error.message : 'Try again.');
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <HeaderIconButton accessibilityLabel="Go back" icon="chevron-back" onPress={onBack} />
        <Text numberOfLines={1} style={styles.headerTitle}>
          Run by {run.user.name}
        </Text>
        {isOwner ? (
          <HeaderIconButton
            accessibilityLabel="Delete run"
            icon="trash-outline"
            onPress={confirmDelete}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {run.routePoints.length >= 2 || run.photoUrl ? (
          <View style={styles.mapCard}>
            <RunMediaCarousel
              height={240}
              onPressMap={run.routePoints.length >= 2 ? () => setMapFullscreen(true) : undefined}
              photoUrl={run.photoUrl}
              routePoints={run.routePoints}
              showMapExpandBadge
            />
          </View>
        ) : null}

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{run.title}</Text>
            <Text style={styles.meta}>
              {extras?.dateLabel || run.postedAt}
              {run.location ? ` · ${run.location}` : ''}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Share this run"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => void handleShare()}
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textPrimary} name="share-outline" size={20} />
          </Pressable>
        </View>

        <PostRunPrimaryStats stats={primaryStats} />
        {summary ? <PostRunChartSection summary={summary} /> : null}
        <MileSplitsSection splits={summary?.splits} />
        {paceDistribution ? <PaceDistributionCard result={paceDistribution} /> : null}
        {climbingAnalysis ? <ClimbingAnalysisCard result={climbingAnalysis} /> : null}
        {heartRateAnalysis ? <HeartRateAnalysisCard result={heartRateAnalysis} /> : null}

        <View style={styles.engagementCard}>
          <RunCardEngagement
            comments={comments}
            likedByMe={liked}
            likes={likes}
            onOpenComments={() => setCommentsOpen(true)}
            onToggleLike={() => void handleToggleLike()}
          />
        </View>

        {deleting ? <Text style={styles.deletingText}>Deleting…</Text> : null}
      </ScrollView>

      <FullscreenRouteMap
        onClose={() => setMapFullscreen(false)}
        routePoints={run.routePoints}
        visible={mapFullscreen}
      />

      <FeedCommentsDrawer
        onClose={() => setCommentsOpen(false)}
        onCommentAdded={() => setComments((count) => count + 1)}
        postId={commentsOpen ? run.id : null}
        visible={commentsOpen}
      />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  mapCard: {
    marginHorizontal: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  engagementCard: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deletingText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
