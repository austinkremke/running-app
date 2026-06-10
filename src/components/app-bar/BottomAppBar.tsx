import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export type BottomAppBarItem = {
  key: string;
  label: string;
  icon: IoniconsName;
  activeIcon?: IoniconsName;
};

export const DEFAULT_BOTTOM_APP_BAR_ITEMS: BottomAppBarItem[] = [
  { key: 'feed', label: 'FEED', icon: 'people-outline', activeIcon: 'people' },
  { key: 'run', label: 'RUN', icon: 'walk-outline', activeIcon: 'walk' },
  { key: 'match', label: 'MATCH', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'me', label: 'ME', icon: 'person-outline', activeIcon: 'person' },
];

type BottomAppBarProps = {
  items?: BottomAppBarItem[];
  activeKey: string;
  onItemPress: (key: string) => void;
};

export function BottomAppBar({
  items = DEFAULT_BOTTOM_APP_BAR_ITEMS,
  activeKey,
  onItemPress,
}: BottomAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const iconName = isActive && item.activeIcon ? item.activeIcon : item.icon;

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
                <Ionicons
                  color={isActive ? colors.accentLime : colors.textSecondary}
                  name={iconName}
                  size={22}
                />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 64,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: colors.accentLime,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
});
