import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Run } from '../../mock';
import type { DistanceBadge } from '../../services/distanceRecords';
import { colors, spacing } from '../../theme';
import { ReportMenu } from '../moderation';
import { RunCardContent } from './RunCardContent';
import { RunCardEngagementMini } from './RunCardEngagementMini';
import { RunCardHeader } from './RunCardHeader';
import { RunMediaCarousel } from './RunMediaCarousel';
import { RunCardStats } from './RunCardStats';

type RunCardProps = {
  run: Run;
  viewerUserId?: string | null;
  engagementDisabled?: boolean;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
  /** Opens the run detail screen — the card body (not the engagement row) is the tap target. */
  onOpenDetail?: () => void;
  /** Opens the runner's profile — the avatar/name specifically, not the rest of the card. */
  onOpenProfile?: () => void;
  /** Current gold/silver/bronze distance-milestone badges this run holds, if any. */
  distanceBadges?: DistanceBadge[];
};

export function RunCard({
  run,
  viewerUserId,
  engagementDisabled = false,
  onToggleLike,
  onOpenComments,
  onOpenDetail,
  onOpenProfile,
  distanceBadges,
}: RunCardProps) {
  const [reportMenuVisible, setReportMenuVisible] = useState(false);
  const isOwnPost = viewerUserId != null && viewerUserId === run.user.id;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityHint="Opens run details"
          accessibilityRole="button"
          disabled={!onOpenDetail}
          onPress={onOpenDetail}
          style={({ pressed }) => [styles.body, pressed && onOpenDetail ? styles.pressed : null]}
        >
          <RunCardHeader
            location={run.location}
            onOpenProfile={onOpenProfile}
            postedAt={run.postedAt}
            user={run.user}
          />
          <RunCardContent
            description={run.description}
            distanceBadges={distanceBadges}
            title={run.title}
          />
        </Pressable>

        <View style={styles.sideActions}>
          {!isOwnPost ? (
            <Pressable
              accessibilityLabel="Report or block"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setReportMenuVisible(true)}
              style={styles.moreButton}
            >
              <Ionicons color={colors.textSecondary} name="ellipsis-horizontal" size={16} />
            </Pressable>
          ) : null}

          <RunCardEngagementMini
            comments={run.comments}
            disabled={engagementDisabled}
            likedByMe={run.likedByMe}
            likes={run.likes}
            onOpenComments={onOpenComments}
            onToggleLike={onToggleLike}
          />
        </View>
      </View>

      {/* Kept out of the tap-to-open Pressable above — nesting a horizontal
          swipe carousel inside a tap target makes small swipe gestures
          misfire as a tap and open run details instead of scrolling. Each
          card inside the carousel gets its own tap-to-open handler instead. */}
      <RunMediaCarousel
        chartData={run.chartData}
        chartReferenceLines={run.chartReferenceLines}
        distanceMiles={run.stats.distanceMiles}
        height={152}
        onPressMap={onOpenDetail}
        onPressPhoto={onOpenDetail}
        photoUrl={run.photoUrl}
        routePoints={run.routePoints}
      />

      <View style={styles.footerBox}>
        <RunCardStats stats={run.stats} />
      </View>

      <ReportMenu
        contentId={run.id}
        contentType="feed_post"
        onClose={() => setReportMenuVisible(false)}
        reportedUserId={run.user.id}
        visible={reportMenuVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  sideActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  moreButton: {
    padding: spacing.xs,
  },
  footerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
});
