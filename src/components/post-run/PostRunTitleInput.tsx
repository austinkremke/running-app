import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '../../theme';

export const RUN_TITLE_MAX_LENGTH = 80;

type PostRunTitleInputProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function PostRunTitleInput({ value, onChangeText }: PostRunTitleInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.counter}>
          {value.length}/{RUN_TITLE_MAX_LENGTH}
        </Text>
      </View>
      <TextInput
        maxLength={RUN_TITLE_MAX_LENGTH}
        onChangeText={onChangeText}
        placeholder="Give your run a title (optional)"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  counter: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: colors.background,
  },
});
