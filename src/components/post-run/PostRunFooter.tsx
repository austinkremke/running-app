import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

type PostRunFooterProps = {
  onAddToFeed?: () => void;
};

export function PostRunFooter({ onAddToFeed }: PostRunFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add to activity feed"
        onPress={onAddToFeed}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.label}>ADD TO ACTIVITY FEED</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8E628',
    paddingVertical: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});
