import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type NotificationPreferenceRowProps = {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

export function NotificationPreferenceRow({
  label,
  value,
  disabled = false,
  onChange,
}: NotificationPreferenceRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        disabled={disabled}
        ios_backgroundColor={colors.border}
        onValueChange={onChange}
        thumbColor={colors.textPrimary}
        trackColor={{ false: colors.border, true: colors.accentLime }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
