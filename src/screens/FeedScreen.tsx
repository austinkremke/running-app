import { ActivityIndicator, Alert, FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import {
  FeedCommentsDrawer,
  FindFriendsDrawer,
  FriendsFindBar,
  RunCard,
  TeamMatchFeedCard,
} from '../components/feed';
import { useAuth } from '../context';
import type { FeedTab, Run, TeamMatchFeedPost } from '../mock';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useFeed } from '../hooks/useFeed';
import { useFriends } from '../hooks/useFriends';
import type { FriendSearchResult } from '../services/friendService';
import { colors, spacing } from '../theme';
import { formatRelativeTime } from '../utils/formatRelativeTime';

type FeedScreenProps = {
  activeTab: FeedTab;
  onOpenRun?: (run: Run) => void;
};

export function FeedScreen({ activeTab, onOpenRun }: FeedScreenProps) {
  const { session } = useAuth();
  const viewerUserId = session?.user?.id ?? null;
  const { items, loading, error, refresh, toggleLike, bumpCommentCount, likingPostId } =
    useFeed(activeTab);
  const { isFriend, addFriendById } = useFriends();
  const { runEvaluation, recordEvent } = useAchievementUnlockPresentation();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const [findFriendsVisible, setFindFriendsVisible] = useState(false);

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

  async function handleShare(run: Run) {
    try {
      await Share.share({
        message: `${run.user.name} ran ${run.stats.distanceMiles.toFixed(1)} mi — ${run.title}`,
      });
      await recordEvent('share_feed_post');
    } catch (shareError) {
      if (shareError instanceof Error && shareError.message.includes('User did not share')) {
        return;
      }
      console.warn('Share failed', shareError);
    }
  }

  async function handleShareMatch(post: TeamMatchFeedPost) {
    try {
      const headline =
        post.result === 'tie'
          ? `${post.homeTeam.name} Tied ${post.awayTeam.name}`
          : `${post.result === 'home' ? post.homeTeam.name : post.awayTeam.name} Defeated ${post.result === 'home' ? post.awayTeam.name : post.homeTeam.name}`;
      await Share.share({
        message: `${headline} (${post.homePoints} - ${post.awayPoints})`,
      });
      await recordEvent('share_feed_post');
    } catch (shareError) {
      if (shareError instanceof Error && shareError.message.includes('User did not share')) {
        return;
      }
      console.warn('Share failed', shareError);
    }
  }

  async function addFriendForUser(friendUserId: string) {
    if (addingFriendId) {
      return;
    }

    setAddingFriendId(friendUserId);
    try {
      await addFriendById(friendUserId);
      await runEvaluation();
      if (activeTab === 'friends') {
        await refresh();
      }
    } catch (addError) {
      Alert.alert(
        'Add friend failed',
        addError instanceof Error ? addError.message : 'Could not add friend.',
      );
    } finally {
      setAddingFriendId(null);
    }
  }

  async function handleAddFriend(run: Run) {
    await addFriendForUser(run.user.id);
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
              onShare={() => {
                void handleShareMatch(item.post);
              }}
              onToggleLike={() => {
                void handleToggleLike(item.id);
              }}
              post={item.post}
              postedAt={formatRelativeTime(item.post.postedAtIso)}
            />
          ) : (
            <RunCard
              addFriendDisabled={addingFriendId === item.run.user.id}
              engagementDisabled={likingPostId === item.id}
              isFriend={isFriend(item.run.user.id)}
              onAddFriend={() => {
                void handleAddFriend(item.run);
              }}
              onOpenComments={() => setCommentsPostId(item.id)}
              onOpenDetail={onOpenRun ? () => onOpenRun(item.run) : undefined}
              onShare={() => {
                void handleShare(item.run);
              }}
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
        onAddFriend={(result) => {
          void handleAddFriendFromSearch(result);
        }}
        onClose={() => {
          setFindFriendsVisible(false);
        }}
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
