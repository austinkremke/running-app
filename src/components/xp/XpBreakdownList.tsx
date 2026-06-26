import { StyleSheet, Text, View } from 'react-native';

import type { XpGainSegment } from '../../types/progression';
import { colors, spacing } from '../../theme';
import { XpBreakdownRow } from './XpBreakdownRow';

type XpBreakdownListProps = {
  segments: XpGainSegment[];
  visibleLineCount: number;
  activeLineIndex: number;
};

export function XpBreakdownList({
  segments,
  visibleLineCount,
  activeLineIndex,
}: XpBreakdownListProps) {
  if (segments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>XP Breakdown</Text>
      <View style={styles.list}>
        {segments.slice(0, visibleLineCount).map((segment, index) => (
          <XpBreakdownRow
            key={`${segment.key}-${index}`}
            segment={segment}
            state={index === activeLineIndex ? 'active' : 'done'}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  heading: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  list: {
    gap: spacing.xs,
  },
});
