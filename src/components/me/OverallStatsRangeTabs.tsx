import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OverallStatsRange } from '../../services/profileStatsService';
import { colors, spacing } from '../../theme';

type OverallStatsRangeTabsProps = {
  value: OverallStatsRange;
  onChange: (range: OverallStatsRange) => void;
};

const TABS: { key: OverallStatsRange; label: string }[] = [
  { key: 'all', label: 'ALL TIME' },
  { key: 'week', label: 'LAST WEEK' },
  { key: 'month', label: 'LAST MONTH' },
  { key: 'year', label: 'LAST YEAR' },
];

export function OverallStatsRangeTabs({ value, onChange }: OverallStatsRangeTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
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
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accentLime,
    borderColor: colors.accentLime,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: colors.background,
  },
});
