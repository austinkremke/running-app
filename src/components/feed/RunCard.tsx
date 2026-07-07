import { Pressable, StyleSheet, View } from 'react-native';

import type { Run } from '../../mock';
import { colors, spacing } from '../../theme';
import { RunCardContent } from './RunCardContent';
import { RunCardEngagement } from './RunCardEngagement';
import { RunCardHeader } from './RunCardHeader';
import { RunCardMedia } from './RunCardMedia';
import { RunCardStats } from './RunCardStats';

type RunCardProps = {
  run: Run;
  viewerUserId?: string | null;
  isFriend?: boolean;
  engagementDisabled?: boolean;
  addFriendDisabled?: boolean;
  onAddFriend?: () => void;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
  onShare?: () => void;
  /** Opens the run detail screen — the card body (not the engagement row) is the tap target. */
  onOpenDetail?: () => void;
};

export function RunCard({
  run,
  viewerUserId = null,
  isFriend = false,
  engagementDisabled = false,
  addFriendDisabled = false,
  onAddFriend,
  onToggleLike,
  onOpenComments,
  onShare,
  onOpenDetail,
}: RunCardProps) {
  const canAddFriend = Boolean(
    viewerUserId && viewerUserId !== run.user.id && !isFriend && onAddFriend,
  );

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityHint="Opens run details"
        accessibilityRole="button"
        disabled={!onOpenDetail}
        onPress={onOpenDetail}
        style={({ pressed }) => [styles.body, pressed && onOpenDetail ? styles.pressed : null]}
      >
        <RunCardHeader
          addFriendDisabled={addFriendDisabled}
          location={run.location}
          onAddFriend={onAddFriend}
          postedAt={run.postedAt}
          showAddFriend={canAddFriend}
          user={run.user}
        />
        <RunCardContent description={run.description} title={run.title} />
        <RunCardMedia photoUrl={run.photoUrl} routePoints={run.routePoints} />
      </Pressable>

      <View style={styles.footerBox}>
        <RunCardStats stats={run.stats} />
        <View style={styles.footerDivider} />
        <RunCardEngagement
          comments={run.comments}
          disabled={engagementDisabled}
          likedByMe={run.likedByMe}
          likes={run.likes}
          onOpenComments={onOpenComments}
          onShare={onShare}
          onToggleLike={onToggleLike}
        />
      </View>
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
  body: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
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
  footerDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
});
