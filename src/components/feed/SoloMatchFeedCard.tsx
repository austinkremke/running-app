import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SoloMatchFeedPost } from '../../mock';
import { colors, spacing } from '../../theme';
import { MatchVsIndicator } from '../match/MatchVsIndicator';
import { formatMatchPoints } from '../match/team/matchTheme';
import { RankBorderAvatar } from '../team/RankBorderAvatar';
import { RunCardEngagement } from './RunCardEngagement';

const AVATAR_SIZE = 48;

type SoloMatchFeedCardProps = {
  post: SoloMatchFeedPost;
  postedAt: string;
  engagementDisabled?: boolean;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
  onShare?: () => void;
  onOpenDetail?: () => void;
};

function headlineFor(post: SoloMatchFeedPost): string {
  if (post.result === 'tie') {
    return `${post.homeRunner.name} Tied ${post.awayRunner.name}`;
  }

  const winner = post.result === 'home' ? post.homeRunner : post.awayRunner;
  const loser = post.result === 'home' ? post.awayRunner : post.homeRunner;
  return `${winner.name} Defeated ${loser.name}`;
}

export function SoloMatchFeedCard({
  post,
  postedAt,
  engagementDisabled = false,
  onToggleLike,
  onOpenComments,
  onShare,
  onOpenDetail,
}: SoloMatchFeedCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole={onOpenDetail ? 'button' : undefined}
        disabled={!onOpenDetail}
        onPress={onOpenDetail}
        style={styles.body}
      >
        <View style={styles.header}>
          <Text style={styles.headline}>{headlineFor(post)}</Text>
          <Text style={styles.postedAt}>{postedAt}</Text>
        </View>

        <View style={styles.scoreboard}>
          <View style={styles.runnersRow}>
            <View style={styles.side}>
              <RankBorderAvatar
                avatarUrl={post.homeRunner.avatarUrl}
                rankTierId={post.homeRunner.rankTierId}
                size={AVATAR_SIZE}
              />
              <Text numberOfLines={1} style={styles.runnerName}>
                {post.homeRunner.name.toUpperCase()}
              </Text>
              <Text style={styles.score}>{formatMatchPoints(post.homePoints)}</Text>
            </View>

            <MatchVsIndicator variant="diamond" />

            <View style={styles.side}>
              <RankBorderAvatar
                avatarUrl={post.awayRunner.avatarUrl}
                rankTierId={post.awayRunner.rankTierId}
                size={AVATAR_SIZE}
              />
              <Text numberOfLines={1} style={styles.runnerName}>
                {post.awayRunner.name.toUpperCase()}
              </Text>
              <Text style={styles.score}>{formatMatchPoints(post.awayPoints)}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.matchLabel}>1v1 Match</Text>
        </View>
      </Pressable>

      <View style={styles.footerBox}>
        <RunCardEngagement
          comments={post.comments}
          disabled={engagementDisabled}
          likedByMe={post.likedByMe}
          likes={post.likes}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headline: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  postedAt: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  scoreboard: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  runnersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  runnerName: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textAlign: 'center',
    maxWidth: '100%',
  },
  score: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  matchLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  footerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
