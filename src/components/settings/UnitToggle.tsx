import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type UnitToggleProps = {
  value: 'miles' | 'kilometers';
  onChange: (value: 'miles' | 'kilometers') => void;
};

const OPTIONS = [
  { key: 'miles' as const, label: 'Miles' },
  { key: 'kilometers' as const, label: 'Kilometers' },
];

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const selected = value === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.key)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.accentLime,
    backgroundColor: colors.surfaceElevated,
  },
  optionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: colors.accentLime,
  },
});
