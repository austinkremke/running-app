import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, spacing } from '../../../../theme';

type TeamChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function TeamChatComposer({
  value,
  onChangeText,
  onSend,
  placeholder = 'Message your team...',
  disabled = false,
}: TeamChatComposerProps) {
  const canSend = !disabled && value.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        editable={!disabled}
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={value}
      />
      <Pressable
        accessibilityLabel="Send message"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.sendButton,
          !canSend && styles.sendButtonDisabled,
          pressed && canSend ? styles.pressed : null,
        ]}
      >
        <Ionicons color={canSend ? colors.background : colors.textSecondary} name="send" size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.accentLime,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
});
