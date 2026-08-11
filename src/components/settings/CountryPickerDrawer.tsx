import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COUNTRY_OPTIONS } from '../../utils/countryOptions.generated';
import { colors, spacing } from '../../theme';
import { FlagIcon } from '../me/FlagIcon';
import { BottomSheetDrawer } from '../drawer';

type CountryPickerDrawerProps = {
  visible: boolean;
  currentCode?: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
  saving?: boolean;
};

export function CountryPickerDrawer({
  visible,
  currentCode,
  onSelect,
  onClose,
  saving = false,
}: CountryPickerDrawerProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((option) => option.name.toLowerCase().includes(trimmed));
  }, [query]);

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close country picker"
      heightRatio={0.82}
      keyboardAvoiding
      onClose={onClose}
      visible={visible}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Your Country</Text>
        <Text style={styles.subtitle}>Used for your country solo rank.</Text>

        <View style={styles.searchField}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={setQuery}
            placeholder="Search countries"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={results}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => {
            const selected = item.code === currentCode;
            return (
              <View>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => onSelect(item.code)}
                  style={({ pressed }) => [styles.row, saving && styles.rowDisabled, pressed && styles.pressed]}
                >
                  <FlagIcon regionCode={item.code} width={28} />
                  <Text numberOfLines={1} style={styles.name}>
                    {item.name}
                  </Text>
                  {selected ? <Text style={styles.selectedMark}>✓</Text> : null}
                </Pressable>
                {index < results.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  searchField: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedMark: {
    color: colors.accentLime,
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 28 + spacing.sm,
  },
});
