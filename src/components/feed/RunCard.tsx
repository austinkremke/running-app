import { StyleSheet, View } from 'react-native';

import type { Run } from '../../mock';
import { colors, spacing } from '../../theme';
import { RunCardContent } from './RunCardContent';
import { RunCardEngagement } from './RunCardEngagement';
import { RunCardHeader } from './RunCardHeader';
import { RunCardMedia } from './RunCardMedia';
import { RunCardStats } from './RunCardStats';

type RunCardProps = {
  run: Run;
  engagementDisabled?: boolean;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
};

export function RunCard({
  run,
  engagementDisabled = false,
  onToggleLike,
  onOpenComments,
}: RunCardProps) {
  return (
    <View style={styles.card}>
      <RunCardHeader location={run.location} postedAt={run.postedAt} user={run.user} />
      <RunCardContent description={run.description} title={run.title} />
      <RunCardMedia photoUrl={run.photoUrl} routePoints={run.routePoints} />

      <View style={styles.footerBox}>
        <RunCardStats stats={run.stats} />
        <View style={styles.footerDivider} />
        <RunCardEngagement
          comments={run.comments}
          disabled={engagementDisabled}
          likedByMe={run.likedByMe}
          likes={run.likes}
          onOpenComments={onOpenComments}
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
