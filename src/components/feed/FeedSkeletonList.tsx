import { View, StyleSheet } from 'react-native';

import { spacing } from '../../theme';
import { RunCardSkeleton } from './RunCardSkeleton';

const SKELETON_COUNT = 4;

export function FeedSkeletonList() {
  return (
    <View style={styles.content}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <RunCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
});
