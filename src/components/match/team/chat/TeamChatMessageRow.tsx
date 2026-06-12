import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../../avatar';
import type { TeamChatMessage } from '../../../../mock';
import { colors, spacing } from '../../../../theme';
import { TEAM_MATCH_AVATAR_BORDER_WIDTH } from '../matchTheme';

type TeamChatMessageRowProps = {
  message: TeamChatMessage;
};

export function TeamChatMessageRow({ message }: TeamChatMessageRowProps) {
  const isCurrentUser = message.isCurrentUser ?? false;

  if (isCurrentUser) {
    return (
      <View style={styles.rowOutgoing}>
        <View style={styles.outgoingMeta}>
          <Text style={styles.time}>{message.sentAt}</Text>
          <Text style={styles.youLabel}>You</Text>
        </View>
        <View style={styles.bubbleOutgoing}>
          <Text style={styles.bodyOutgoing}>{message.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowIncoming}>
      <Avatar
        avatarUrl={message.avatarUrl}
        borderColor={colors.divider}
        borderWidth={TEAM_MATCH_AVATAR_BORDER_WIDTH}
        size={32}
      />

      <View style={styles.incomingContent}>
        <View style={styles.incomingMeta}>
          <Text style={styles.author}>{message.authorName}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{message.sentAt}</Text>
        </View>
        <View style={styles.bubbleIncoming}>
          <Text style={styles.bodyIncoming}>{message.body}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowIncoming: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  incomingContent: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  incomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  author: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  time: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  bubbleIncoming: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: colors.background,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bodyIncoming: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  rowOutgoing: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  outgoingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  youLabel: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '700',
  },
  bubbleOutgoing: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    backgroundColor: colors.accentLime,
    borderRadius: 14,
    borderTopRightRadius: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bodyOutgoing: {
    color: colors.background,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
