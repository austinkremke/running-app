import { StyleSheet, View } from 'react-native';

import type { Run } from '../../mock';
import { colors, spacing } from '../../theme';
import { RunCardContent } from './RunCardContent';
import { RunCardEngagement } from './RunCardEngagement';
import { RunCardHeader } from './RunCardHeader';
import { RunCardMedia } from './RunCardMedia';
import { RunCardPaceHighlight } from './RunCardPaceHighlight';
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
}: RunCardProps) {
  const canAddFriend = Boolean(
    viewerUserId && viewerUserId !== run.user.id && !isFriend && onAddFriend,
  );

  return (
    <View style={styles.card}>
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
      {run.paceHighlight ? <RunCardPaceHighlight highlight={run.paceHighlight} /> : null}

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
