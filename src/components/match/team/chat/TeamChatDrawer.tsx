import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamChatMessage } from '../../../../mock';
import { MOCK_TEAM_CHAT_MESSAGES } from '../../../../mock';
import { colors, spacing } from '../../../../theme';
import { BottomSheetDrawer } from '../../../drawer';
import { TeamChatComposer } from './TeamChatComposer';
import { TeamChatMessageList } from './TeamChatMessageList';

type TeamChatDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

function formatSentTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TeamChatDrawer({ visible, onClose }: TeamChatDrawerProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>(MOCK_TEAM_CHAT_MESSAGES);
  const [draft, setDraft] = useState('');

  function handleSend() {
    const body = draft.trim();
    if (!body) {
      return;
    }

    const nextMessage: TeamChatMessage = {
      id: `chat-${Date.now()}`,
      authorName: 'Austin',
      body,
      sentAt: formatSentTime(new Date()),
      isCurrentUser: true,
    };

    setMessages((current) => [...current, nextMessage]);
    setDraft('');
  }

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close team chat"
      footer={
        <TeamChatComposer onChangeText={setDraft} onSend={handleSend} value={draft} />
      }
      heightRatio={0.82}
      keyboardAvoiding
      onClose={onClose}
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Team Chat</Text>
          <Text style={styles.subtitle}>Road Warriors match thread</Text>
        </View>
        <TeamChatMessageList messages={messages} />
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});
