import { ActivityIndicator, Alert, FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { FeedCommentsDrawer, RunCard } from '../components/feed';
import { useAuth } from '../context';
import type { FeedTab, Run } from '../mock';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useFeed } from '../hooks/useFeed';
import { useFriends } from '../hooks/useFriends';
import { colors, spacing } from '../theme';

type FeedScreenProps = {
  activeTab: FeedTab;
};

export function FeedScreen({ activeTab }: FeedScreenProps) {
  const { session } = useAuth();
  const viewerUserId = session?.user?.id ?? null;
  const { runs, loading, error, refresh, toggleLike, bumpCommentCount, likingPostId } =
    useFeed(activeTab);
  const { isFriend, addFriendById } = useFriends();
  const { runEvaluation, recordEvent } = useAchievementUnlockPresentation();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

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

  async function handleAddFriend(run: Run) {
    if (addingFriendId) {
      return;
    }

    setAddingFriendId(run.user.id);
    try {
      await addFriendById(run.user.id);
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

  if (runs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          {activeTab === 'friends'
            ? 'No friend runs yet. Add runners from the Community feed to see their posts here.'
            : 'No runs here yet. Finish a run and tap Lock In Your Run.'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        contentContainerStyle={styles.content}
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RunCard
            addFriendDisabled={addingFriendId === item.user.id}
            engagementDisabled={likingPostId === item.id}
            isFriend={isFriend(item.user.id)}
            onAddFriend={() => {
              void handleAddFriend(item);
            }}
            onOpenComments={() => setCommentsPostId(item.id)}
            onShare={() => {
              void handleShare(item);
            }}
            onToggleLike={() => {
              void handleToggleLike(item.id);
            }}
            run={item}
            viewerUserId={viewerUserId}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
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
