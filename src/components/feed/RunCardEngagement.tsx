import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type RunCardEngagementProps = {
  likes: number;
  comments: number;
};

export function RunCardEngagement({ likes, comments }: RunCardEngagementProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Ionicons color={colors.accentLime} name="heart-outline" size={20} />
        <Text style={styles.likeCount}>{likes}</Text>
      </View>
      <View style={styles.stat}>
        <Ionicons color={colors.textPrimary} name="chatbubble-outline" size={20} />
        <Text style={styles.commentCount}>{comments}</Text>
      </View>
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
