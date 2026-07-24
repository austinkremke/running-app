import { Ionicons } from '@expo/vector-icons';
import { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RunnerIcon } from '../icons';
import { colors, layout, spacing } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type BottomAppBarSvgIconProps = {
  color: string;
  size: number;
};

export type BottomAppBarItem = {
  key: string;
  label: string;
  icon: IoniconsName;
  activeIcon?: IoniconsName;
  SvgIcon?: ComponentType<BottomAppBarSvgIconProps>;
};

export const DEFAULT_BOTTOM_APP_BAR_ITEMS: BottomAppBarItem[] = [
  { key: 'feed', label: 'Social', icon: 'people-outline', activeIcon: 'people' },
  { key: 'run', label: 'Run', icon: 'walk-outline', activeIcon: 'walk', SvgIcon: RunnerIcon },
  { key: 'match', label: 'Match', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'team', label: 'Team', icon: 'shield-outline', activeIcon: 'shield' },
  { key: 'me', label: 'Me', icon: 'person-outline', activeIcon: 'person' },
];

type BottomAppBarProps = {
  items?: BottomAppBarItem[];
  activeKey: string;
  onItemPress: (key: string) => void;
  badges?: Partial<Record<string, boolean>>;
};

export function BottomAppBar({
  items = DEFAULT_BOTTOM_APP_BAR_ITEMS,
  activeKey,
  onItemPress,
  badges,
}: BottomAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const iconName = isActive && item.activeIcon ? item.activeIcon : item.icon;
          const iconColor = isActive ? colors.accentLime : colors.textSecondary;
          const SvgIcon = item.SvgIcon;

          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.label}
              onPress={() => onItemPress(item.key)}
              style={styles.itemPressable}
            >
              <View style={styles.item}>
                <View style={styles.iconWrap}>
                  {SvgIcon ? (
                    <SvgIcon color={iconColor} size={18} />
                  ) : (
                    <Ionicons color={iconColor} name={iconName} size={18} />
                  )}
                  {badges?.[item.key] ? <View style={styles.badge} /> : null}
                </View>
                <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bar: {
    width: '100%',
    minHeight: layout.bottomAppBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  itemPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minWidth: 48,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.accentLime,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
});
