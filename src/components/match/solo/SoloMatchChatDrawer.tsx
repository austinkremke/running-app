import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useMatchChat } from '../../../hooks/useMatchChat';
import { colors, spacing } from '../../../theme';
import { BottomSheetDrawer } from '../../drawer';
import { TeamChatComposer } from '../team/chat/TeamChatComposer';
import { TeamChatMessageList } from '../team/chat/TeamChatMessageList';

type SoloMatchChatDrawerProps = {
  visible: boolean;
  matchId: string;
  opponentName: string;
  onClose: () => void;
};

export function SoloMatchChatDrawer({
  visible,
  matchId,
  opponentName,
  onClose,
}: SoloMatchChatDrawerProps) {
  const [draft, setDraft] = useState('');
  const { messages, loading, sending, error, send } = useMatchChat(matchId, visible);

  useEffect(() => {
    if (!visible) {
      setDraft('');
    }
  }, [visible]);

  async function handleSend() {
    const body = draft.trim();
    if (!body) {
      return;
    }

    await send(body);
    setDraft('');
  }

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close match chat"
      footer={
        <TeamChatComposer
          disabled={sending}
          onChangeText={setDraft}
          onSend={() => {
            void handleSend();
          }}
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

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accentLime} />
          </View>
        ) : (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TeamChatMessageList messages={messages} />
          </>
        )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
