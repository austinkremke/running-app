import { useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import type { TeamChatMessage } from '../../../../mock';
import { spacing } from '../../../../theme';
import { TeamChatMessageRow } from './TeamChatMessageRow';

type TeamChatMessageListProps = {
  messages: TeamChatMessage[];
};

export function TeamChatMessageList({ messages }: TeamChatMessageListProps) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    >
      {messages.map((message) => (
        <TeamChatMessageRow key={message.id} message={message} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
