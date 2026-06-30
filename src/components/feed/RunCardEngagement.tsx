import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type RunCardEngagementProps = {
  likes: number;
  comments: number;
  likedByMe: boolean;
  disabled?: boolean;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
};

export function RunCardEngagement({
  likes,
  comments,
  likedByMe,
  disabled = false,
  onToggleLike,
  onOpenComments,
}: RunCardEngagementProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={likedByMe ? 'Unlike post' : 'Like post'}
        accessibilityRole="button"
        disabled={disabled || !onToggleLike}
        onPress={onToggleLike}
        style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
      >
        <Ionicons
          color={likedByMe ? colors.accentLime : colors.accentLime}
          name={likedByMe ? 'heart' : 'heart-outline'}
          size={20}
        />
        <Text style={styles.likeCount}>{likes}</Text>
      </Pressable>

      <Pressable
        accessibilityLabel="View comments"
        accessibilityRole="button"
        disabled={!onOpenComments}
        onPress={onOpenComments}
        style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
      >
        <Ionicons color={colors.textPrimary} name="chatbubble-outline" size={20} />
        <Text style={styles.commentCount}>{comments}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  likeCount: {
    color: colors.accentLime,
    fontSize: 13,
    fontWeight: '700',
  },
  commentCount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
