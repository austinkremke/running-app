import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../../theme';

type OnboardingProgressIndicatorProps = {
  stepCount: number;
  activeIndex: number;
};

export function OnboardingProgressIndicator({
  stepCount,
  activeIndex,
}: OnboardingProgressIndicatorProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: stepCount }).map((_, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.segment,
              isActive && styles.segmentActive,
              isDone && styles.segmentDone,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
  },
  segmentDone: {
    backgroundColor: colors.accentLime,
  },
  segmentActive: {
    backgroundColor: colors.accentLime,
  },
});
