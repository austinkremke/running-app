import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TeamMatchFeedPost } from '../../mock';
import { colors, spacing } from '../../theme';
import { MatchVsIndicator } from '../match/MatchVsIndicator';
import { formatMatchPoints } from '../match/team/matchTheme';
import { TeamAvatar } from '../team/TeamAvatar';
import { getTeamLogoAccentColor } from '../team/teamLogoTheme';
import { RunCardEngagementMini } from './RunCardEngagementMini';

const LOGO_SIZE = 48;

type TeamMatchFeedCardProps = {
  post: TeamMatchFeedPost;
  postedAt: string;
  engagementDisabled?: boolean;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
  onOpenDetail?: () => void;
};

function headlineFor(post: TeamMatchFeedPost): string {
  if (post.result === 'tie') {
    return `${post.homeTeam.name} Tied ${post.awayTeam.name}`;
  }

  const winner = post.result === 'home' ? post.homeTeam : post.awayTeam;
  const loser = post.result === 'home' ? post.awayTeam : post.homeTeam;
  return `${winner.name} Defeated ${loser.name}`;
}

export function TeamMatchFeedCard({
  post,
  postedAt,
  engagementDisabled = false,
  onToggleLike,
  onOpenComments,
  onOpenDetail,
}: TeamMatchFeedCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole={onOpenDetail ? 'button' : undefined}
        disabled={!onOpenDetail}
        onPress={onOpenDetail}
        style={styles.body}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headline}>{headlineFor(post)}</Text>
            <Text style={styles.postedAt}>{postedAt}</Text>
          </View>
          <RunCardEngagementMini
            comments={post.comments}
            disabled={engagementDisabled}
            likedByMe={post.likedByMe}
            likes={post.likes}
            onOpenComments={onOpenComments}
            onToggleLike={onToggleLike}
          />
        </View>

        <View style={styles.scoreboard}>
          <View style={styles.teamsRow}>
            <View style={styles.side}>
              <TeamAvatar
                accent={post.homeTeam.accent}
                icon={post.homeTeam.shieldIcon}
                imageUrl={post.homeTeam.logoUrl}
                rankTierId={post.homeTeam.rankTierId}
                size={LOGO_SIZE}
              />
              <Text
                numberOfLines={1}
                style={[styles.teamName, { color: getTeamLogoAccentColor(post.homeTeam.accent) }]}
              >
                {post.homeTeam.name.toUpperCase()}
              </Text>
              <Text style={styles.score}>{formatMatchPoints(post.homePoints)}</Text>
            </View>

            <MatchVsIndicator variant="diamond" />

            <View style={styles.side}>
              <TeamAvatar
                accent={post.awayTeam.accent}
                icon={post.awayTeam.shieldIcon}
                imageUrl={post.awayTeam.logoUrl}
                rankTierId={post.awayTeam.rankTierId}
                size={LOGO_SIZE}
              />
              <Text
                numberOfLines={1}
                style={[styles.teamName, { color: getTeamLogoAccentColor(post.awayTeam.accent) }]}
              >
                {post.awayTeam.name.toUpperCase()}
              </Text>
              <Text style={styles.score}>{formatMatchPoints(post.awayPoints)}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.matchLabel}>Team Match</Text>
        </View>
      </Pressable>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  postedAt: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'left',
  },
  scoreboard: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  teamsRow: {
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
  teamName: {
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
});
