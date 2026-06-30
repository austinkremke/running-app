import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { FeedCommentsDrawer, RunCard } from '../components/feed';
import type { FeedTab } from '../mock';
import { useFeed } from '../hooks/useFeed';
import { colors, spacing } from '../theme';

type FeedScreenProps = {
  activeTab: FeedTab;
};

export function FeedScreen({ activeTab }: FeedScreenProps) {
  const { runs, loading, error, toggleLike, bumpCommentCount, likingPostId } = useFeed(activeTab);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  async function handleToggleLike(postId: string) {
    try {
      await toggleLike(postId);
    } catch (likeError) {
      Alert.alert(
        'Like failed',
        likeError instanceof Error ? likeError.message : 'Could not update like.',
      );
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
            ? 'Friends feed is coming soon.'
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
            engagementDisabled={likingPostId === item.id}
            onOpenComments={() => setCommentsPostId(item.id)}
            onToggleLike={() => {
              void handleToggleLike(item.id);
            }}
            run={item}
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
