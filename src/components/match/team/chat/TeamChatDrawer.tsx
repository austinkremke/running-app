import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useMatchChat } from '../../../../hooks/useMatchChat';
import { colors, spacing } from '../../../../theme';
import { BottomSheetDrawer } from '../../../drawer';
import { TeamChatComposer } from './TeamChatComposer';
import { TeamChatMessageList } from './TeamChatMessageList';

type TeamChatDrawerProps = {
  visible: boolean;
  matchId: string | null;
  subtitle: string;
  onClose: () => void;
};

export function TeamChatDrawer({ visible, matchId, subtitle, onClose }: TeamChatDrawerProps) {
  const [draft, setDraft] = useState('');
  const { messages, loading, sending, error, send } = useMatchChat(matchId, visible);
  const chatAvailable = matchId != null;

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
      accessibilityLabel="Close team chat"
      footer={
        chatAvailable ? (
          <TeamChatComposer
            disabled={sending}
            onChangeText={setDraft}
            onSend={() => {
              void handleSend();
            }}
            value={draft}
          />
        ) : null
      }
      heightRatio={0.82}
      keyboardAvoiding
      onClose={onClose}
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Team Chat</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {!chatAvailable ? (
          <Text style={styles.message}>Join an active team match to chat with your crew.</Text>
        ) : loading ? (
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
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
