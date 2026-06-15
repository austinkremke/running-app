import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TeamChatMessage } from '../../../mock';
import { MOCK_SOLO_CHAT_MESSAGES } from '../../../mock/soloChat';
import { colors, spacing } from '../../../theme';
import { BottomSheetDrawer } from '../../drawer';
import { TeamChatComposer } from '../team/chat/TeamChatComposer';
import { TeamChatMessageList } from '../team/chat/TeamChatMessageList';

type SoloMatchChatDrawerProps = {
  visible: boolean;
  opponentName: string;
  onClose: () => void;
};

function formatSentTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SoloMatchChatDrawer({
  visible,
  opponentName,
  onClose,
}: SoloMatchChatDrawerProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>(MOCK_SOLO_CHAT_MESSAGES);
  const [draft, setDraft] = useState('');

  function handleSend() {
    const body = draft.trim();
    if (!body) {
      return;
    }

    const nextMessage: TeamChatMessage = {
      id: `solo-chat-${Date.now()}`,
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
      accessibilityLabel="Close match chat"
      footer={
        <TeamChatComposer
          onChangeText={setDraft}
          onSend={handleSend}
          placeholder={`Message ${opponentName}...`}
          value={draft}
        />
      }
      heightRatio={0.82}
      keyboardAvoiding
      onClose={onClose}
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Match Chat</Text>
          <Text style={styles.subtitle}>1v1 thread with {opponentName}</Text>
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
