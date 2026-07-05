import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FullscreenRouteMap, StaticRouteMapPreview } from '../components/map';
import {
  MileSplitsSection,
  PostRunChartSection,
  PostRunPrimaryStats,
} from '../components/post-run';
import { FeedCommentsDrawer, RunCardEngagement } from '../components/feed';
import { HeaderIconButton } from '../components/header';
import { useUserId } from '../context';
import type { Run } from '../mock';
import {
  deleteActivity,
  fetchRunExtras,
  type RunExtras,
} from '../services/activityDetailService';
import { toggleFeedLike } from '../services/feedEngagementService';
import { colors, spacing } from '../theme';

type RunDetailScreenProps = {
  run: Run;
  onBack?: () => void;
  onDeleted?: () => void;
};

export function RunDetailScreen({ run, onBack, onDeleted }: RunDetailScreenProps) {
  const viewerId = useUserId();
  const [extras, setExtras] = useState<RunExtras | null>(null);
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
          {run.title}
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
        <Pressable
          accessibilityHint="Opens the route full screen"
          accessibilityLabel="View route full screen"
          accessibilityRole="button"
          onPress={() => setMapFullscreen(true)}
          style={styles.mapCard}
        >
          <StaticRouteMapPreview routePoints={run.routePoints} style={styles.map} />
          <View style={styles.expandBadge}>
            <Ionicons color={colors.textPrimary} name="expand" size={14} />
          </View>
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{run.title}</Text>
          <Text style={styles.meta}>
            {extras?.dateLabel || run.postedAt}
            {run.location ? ` · ${run.location}` : ''}
          </Text>
        </View>

        <PostRunPrimaryStats stats={primaryStats} />
        {summary ? <PostRunChartSection summary={summary} /> : null}
        <MileSplitsSection splits={summary?.splits} />

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
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  expandBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleBlock: {
    paddingHorizontal: spacing.lg,
    gap: 4,
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
