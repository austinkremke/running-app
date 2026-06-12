import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout, spacing, typography } from '../../theme';

export type TabAppHeaderItem = {
  key: string;
  label: string;
};

type TabAppHeaderProps = {
  tabs: TabAppHeaderItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  showBorder?: boolean;
  accentActive?: boolean;
  compact?: boolean;
};

export function TabAppHeader({
  tabs,
  activeTab,
  onTabPress,
  showBorder = true,
  accentActive = false,
  compact = false,
}: TabAppHeaderProps) {
  return (
    <View style={[styles.container, showBorder && styles.bordered]}>
      <View style={styles.row}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onTabPress(tab.key)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.label,
                  compact && styles.labelCompact,
                  isActive
                    ? accentActive
                      ? styles.labelAccentActive
                      : styles.labelActive
                    : styles.labelInactive,
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.indicator,
                  compact && styles.indicatorCompact,
                  !isActive && styles.indicatorHidden,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: layout.tabBarHeight,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  label: {
    ...typography.tabLabel,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  labelActive: {
    color: colors.textPrimary,
  },
  labelAccentActive: {
    color: colors.accentLime,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
  indicator: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accentLime,
  },
  indicatorCompact: {
    height: 2,
    borderRadius: 1,
  },
  indicatorHidden: {
    backgroundColor: 'transparent',
  },
});
