import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, layout } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type HeaderIconButtonProps = {
  icon: IoniconsName;
  onPress?: () => void;
  accessibilityLabel: string;
  showBadge?: boolean;
  size?: number;
  /** Plain icons match the feed header screenshot; contained adds a rounded surface. */
  variant?: 'plain' | 'contained';
};

export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  showBadge = false,
  size = 24,
  variant = 'plain',
}: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'contained' && styles.contained,
        pressed && styles.pressed,
      ]}
      hitSlop={8}
    >
      <Ionicons color={colors.textPrimary} name={icon} size={size} />
      {showBadge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: layout.iconButtonSize,
    height: layout.iconButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contained: {
    borderRadius: layout.iconButtonSize / 2,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentLime,
  },
});
