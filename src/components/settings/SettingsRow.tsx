import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme';

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  icon,
  label,
  value,
  destructive = false,
  disabled = false,
  showChevron = true,
  onPress,
}: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.left}>
        <Ionicons
          color={destructive ? colors.accentOrange : colors.textPrimary}
          name={icon}
          size={18}
        />
        <View style={styles.copy}>
          <Text style={[styles.label, destructive && styles.destructiveLabel]}>{label}</Text>
          {value ? <Text style={styles.value}>{value}</Text> : null}
        </View>
      </View>
      {showChevron && onPress ? (
        <Ionicons color={colors.textSecondary} name="chevron-forward" size={16} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, disabled && styles.disabled]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
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
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  destructiveLabel: {
    color: colors.accentOrange,
  },
  value: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
