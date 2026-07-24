import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import {
  FeedCommentsDrawer,
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
import { useFriends } from '../hooks/useFriends';
import type { FriendSearchResult } from '../services/friendService';
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
  const { isFriend, isPending, sendFriendRequestTo } = useFriends();
  const { runEvaluation } = useAchievementUnlockPresentation();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
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
      ? 'No friend runs yet. Search for runners above or add friends from the Community feed.'
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

  async function addFriendForUser(friendUserId: string) {
    if (addingFriendId) {
      return;
    }

    setAddingFriendId(friendUserId);
    try {
      await sendFriendRequestTo(friendUserId);
      await runEvaluation();
      if (activeTab === 'friends') {
        await refresh();
      }
    } catch (addError) {
      Alert.alert(
        'Friend request failed',
        addError instanceof Error ? addError.message : 'Could not send friend request.',
      );
    } finally {
      setAddingFriendId(null);
    }
  }

  async function handleAddFriendFromSearch(result: FriendSearchResult) {
    await addFriendForUser(result.id);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentLime} />
      </View>
    );
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
        addingFriendId={addingFriendId}
        isFriend={isFriend}
        isFriendPending={isPending}
        onAddFriend={(result) => {
          void handleAddFriendFromSearch(result);
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
