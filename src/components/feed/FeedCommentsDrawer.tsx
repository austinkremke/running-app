import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { FeedComment } from '../../mock';
import { addFeedComment, fetchFeedComments } from '../../services/feedEngagementService';
import { colors, spacing } from '../../theme';
import { BottomSheetDrawer } from '../drawer';

type FeedCommentsDrawerProps = {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
  onCommentAdded?: () => void;
};

export function FeedCommentsDrawer({
  visible,
  postId,
  onClose,
  onCommentAdded,
}: FeedCommentsDrawerProps) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!postId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await fetchFeedComments(postId);
      setComments(next);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load comments.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!visible || !postId) {
      setComments([]);
      setDraft('');
      setError(null);
      return;
    }

    void loadComments();
  }, [loadComments, postId, visible]);

  async function handleSubmit() {
    if (!postId || !draft.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const comment = await addFeedComment(postId, draft);
      setComments((previous) => [...previous, comment]);
      setDraft('');
      onCommentAdded?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheetDrawer
      footer={
        <View style={styles.composeRow}>
          <TextInput
            editable={!submitting}
            multiline
            onChangeText={setDraft}
            placeholder="Add a comment…"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={draft}
          />
          <Pressable
            accessibilityLabel="Post comment"
            accessibilityRole="button"
            disabled={submitting || !draft.trim()}
            onPress={() => {
              void handleSubmit();
            }}
            style={({ pressed }) => [
              styles.sendButton,
              (submitting || !draft.trim()) && styles.sendButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sendLabel}>{submitting ? '…' : 'Post'}</Text>
          </Pressable>
        </View>
      }
      heightRatio={0.62}
      keyboardAvoiding
      onClose={onClose}
      visible={visible && Boolean(postId)}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Comments</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accentLime} />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={comments}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>No comments yet. Start the conversation.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                {item.authorAvatarUrl ? (
                  <Image source={{ uri: item.authorAvatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]} />
                )}
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.author}>{item.authorName}</Text>
                    <Text style={styles.time}>{item.postedAt}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.body}</Text>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
  },
  avatarPlaceholder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentBody: {
    flex: 1,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  author: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  commentText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: colors.background,
  },
  sendButton: {
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendLabel: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
  error: {
    color: '#FF8A8A',
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
