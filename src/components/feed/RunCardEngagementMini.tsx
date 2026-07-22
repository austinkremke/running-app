import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';

type RunCardEngagementMiniProps = {
  likes: number;
  comments: number;
  likedByMe: boolean;
  disabled?: boolean;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
};

export function RunCardEngagementMini({
  likes,
  comments,
  likedByMe,
  disabled = false,
  onToggleLike,
  onOpenComments,
}: RunCardEngagementMiniProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={likedByMe ? 'Unlike post' : 'Like post'}
        accessibilityRole="button"
        disabled={disabled || !onToggleLike}
        onPress={onToggleLike}
        style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
      >
        <Ionicons color={colors.textPrimary} name={likedByMe ? 'thumbs-up' : 'thumbs-up-outline'} size={22} />
        {likes > 0 ? <Text style={styles.likeCount}>{likes}</Text> : null}
      </Pressable>

      <Pressable
        accessibilityLabel="View comments"
        accessibilityRole="button"
        disabled={!onOpenComments}
        onPress={onOpenComments}
        style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
      >
        <Ionicons color={colors.textPrimary} name="chatbubble-outline" size={22} />
        {comments > 0 ? <Text style={styles.commentCount}>{comments}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  likeCount: {
    color: colors.accentLime,
    fontSize: 12,
    fontWeight: '700',
  },
  commentCount: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
