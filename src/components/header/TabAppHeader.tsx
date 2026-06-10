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
};

export function TabAppHeader({
  tabs,
  activeTab,
  onTabPress,
  showBorder = true,
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
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                {tab.label}
              </Text>
              <View style={[styles.indicator, !isActive && styles.indicatorHidden]} />
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
  labelActive: {
    color: colors.textPrimary,
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
  indicatorHidden: {
    backgroundColor: 'transparent',
  },
});
