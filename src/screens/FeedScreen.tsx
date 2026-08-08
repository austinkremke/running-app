import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import {
  FeedCommentsDrawer,
  FeedSkeletonList,
  FindFriendsDrawer,
  FriendsFindBar,
  RunCard,
  SoloMatchFeedCard,
  TeamMatchFeedCard,
} from '../components/feed';
import { useAuth } from '../context';
import type { FeedTab, Run } from '../mock';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useFeed } from '../hooks/useFeed';
import { useFollows } from '../hooks/useFollows';
import type { FollowSearchResult } from '../services/followService';
import { fetchDistanceBadges, type DistanceBadge } from '../services/distanceRecords';
import { colors, spacing } from '../theme';
import { formatRelativeTime } from '../utils/formatRelativeTime';

type FeedScreenProps = {
  activeTab: FeedTab;
  onOpenRun?: (run: Run) => void;
  onOpenProfile?: (userId: string) => void;
  onOpenSoloMatch?: (matchId: string) => void;
  onOpenTeamMatch?: (matchId: string) => void;
};

export function FeedScreen({
  activeTab,
  onOpenRun,
  onOpenProfile,
  onOpenSoloMatch,
  onOpenTeamMatch,
}: FeedScreenProps) {
  const { session } = useAuth();
  const viewerUserId = session?.user?.id ?? null;
  const { items, loading, error, refresh, toggleLike, bumpCommentCount, likingPostId } =
    useFeed(activeTab);
  const { isFollowing, follow } = useFollows();
  const { runEvaluation } = useAchievementUnlockPresentation();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [followingBusyId, setFollowingBusyId] = useState<string | null>(null);
  const [findFriendsVisible, setFindFriendsVisible] = useState(false);
  const [distanceBadges, setDistanceBadges] = useState<Record<string, DistanceBadge[]>>({});

  useEffect(() => {
    const runActivityIds = items
      .filter((item) => item.kind === 'run')
      .map((item) => item.run.activityId);

    if (runActivityIds.length === 0) {
      setDistanceBadges({});
      return;
    }

    let cancelled = false;
    fetchDistanceBadges(runActivityIds)
      .then((badges) => {
        if (!cancelled) setDistanceBadges(badges);
      })
      .catch(() => {
        if (!cancelled) setDistanceBadges({});
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const emptyMessage =
    activeTab === 'friends'
      ? 'No runs from people you follow yet. Search for runners above or follow them from the Community feed.'
      : 'No runs here yet. Finish a run and tap Lock In Your Run.';

  async function handleToggleLike(postId: string) {
    try {
      await toggleLike(postId);
      await runEvaluation();
    } catch (likeError) {
      Alert.alert(
        'Like failed',
        likeError instanceof Error ? likeError.message : 'Could not update like.',
      );
    }
  }

  async function followUserFromFeed(followedUserId: string) {
    if (followingBusyId) {
      return;
    }

    setFollowingBusyId(followedUserId);
    try {
      await follow(followedUserId);
      await runEvaluation();
      if (activeTab === 'friends') {
        await refresh();
      }
    } catch (followError) {
      Alert.alert(
        'Follow failed',
        followError instanceof Error ? followError.message : 'Could not follow that runner.',
      );
    } finally {
      setFollowingBusyId(null);
    }
  }

  async function handleFollowFromSearch(result: FollowSearchResult) {
    await followUserFromFeed(result.id);
  }

  if (loading) {
    return <FeedSkeletonList />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.message}>{emptyMessage}</Text>
          </View>
        }
        ListHeaderComponent={
          activeTab === 'friends' ? (
            <FriendsFindBar
              onPress={() => {
                setFindFriendsVisible(true);
              }}
            />
          ) : null
        }
        renderItem={({ item }) =>
          item.kind === 'match' ? (
            <TeamMatchFeedCard
              engagementDisabled={likingPostId === item.id}
              onOpenComments={() => setCommentsPostId(item.id)}
              onOpenDetail={onOpenTeamMatch ? () => onOpenTeamMatch(item.post.matchId) : undefined}
              onToggleLike={() => {
                void handleToggleLike(item.id);
              }}
              post={item.post}
              postedAt={formatRelativeTime(item.post.postedAtIso)}
            />
          ) : item.kind === 'soloMatch' ? (
            <SoloMatchFeedCard
              engagementDisabled={likingPostId === item.id}
              onOpenComments={() => setCommentsPostId(item.id)}
              onOpenDetail={onOpenSoloMatch ? () => onOpenSoloMatch(item.post.matchId) : undefined}
              onToggleLike={() => {
                void handleToggleLike(item.id);
              }}
              post={item.post}
              postedAt={formatRelativeTime(item.post.postedAtIso)}
            />
          ) : (
            <RunCard
              distanceBadges={distanceBadges[item.run.activityId]}
              engagementDisabled={likingPostId === item.id}
              onOpenComments={() => setCommentsPostId(item.id)}
              onOpenDetail={onOpenRun ? () => onOpenRun(item.run) : undefined}
              onOpenProfile={onOpenProfile ? () => onOpenProfile(item.run.user.id) : undefined}
              onToggleLike={() => {
                void handleToggleLike(item.id);
              }}
              run={item.run}
              viewerUserId={viewerUserId}
            />
          )
        }
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <FindFriendsDrawer
        busyUserId={followingBusyId}
        isFollowing={isFollowing}
        onFollow={(result) => {
          void handleFollowFromSearch(result);
        }}
        onClose={() => {
          setFindFriendsVisible(false);
        }}
        onOpenProfile={onOpenProfile ? (result) => onOpenProfile(result.id) : undefined}
        viewerUserId={viewerUserId}
        visible={findFriendsVisible}
      />

      <FeedCommentsDrawer
        onClose={() => setCommentsPostId(null)}
        onCommentAdded={() => {
          if (commentsPostId) {
            bumpCommentCount(commentsPostId);
          }
          void runEvaluation();
        }}
        postId={commentsPostId}
        visible={commentsPostId != null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: 280,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
