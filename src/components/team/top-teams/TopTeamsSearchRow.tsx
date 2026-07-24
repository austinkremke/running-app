import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, spacing } from '../../../theme';

type TopTeamsSearchRowProps = {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
};

export function TopTeamsSearchRow({
  query,
  onQueryChange,
  placeholder = 'Search teams...',
}: TopTeamsSearchRowProps) {
  return (
    <View style={styles.searchField}>
      <TextInput
        accessibilityLabel={placeholder}
        onChangeText={onQueryChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={query}
      />
      <Ionicons color={colors.textSecondary} name="search" size={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 0,
  },
});
