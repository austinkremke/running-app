import { StyleSheet, Text, View } from 'react-native';

import type { XpGainSegment } from '../../types/progression';
import { colors, spacing } from '../../theme';
import { XpBreakdownRow } from './XpBreakdownRow';

type XpBreakdownListProps = {
  segments: XpGainSegment[];
  visibleLineCount: number;
  activeLineIndex: number;
};

function rowState(
  index: number,
  visibleLineCount: number,
  activeLineIndex: number,
): 'pending' | 'active' | 'done' {
  if (index >= visibleLineCount) {
    return 'pending';
  }

  if (index === activeLineIndex) {
    return 'active';
  }

  return 'done';
}

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
        {segments.map((segment, index) => (
          <XpBreakdownRow
            key={`${segment.key}-${index}`}
            segment={segment}
            state={rowState(index, visibleLineCount, activeLineIndex)}
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
