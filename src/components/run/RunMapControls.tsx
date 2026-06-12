import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

type RunMapControlsProps = {
  onBack?: () => void;
};

export function RunMapControls({ onBack }: RunMapControlsProps) {
  const insets = useSafeAreaInsets();
  const controlsTop = insets.top + spacing.lg;

  return (
    <>
      <Pressable
        accessibilityLabel="Go back"
        onPress={onBack}
        style={[styles.mapButton, styles.backButton, { top: controlsTop }]}
      >
        <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
      </Pressable>

      <View style={[styles.rightControls, { top: controlsTop }]}>
        <Pressable accessibilityLabel="Map layers" style={styles.mapButton}>
          <Ionicons color={colors.textPrimary} name="layers-outline" size={18} />
        </Pressable>
        <Pressable accessibilityLabel="Map orientation" style={styles.mapButton}>
          <Ionicons color={colors.textPrimary} name="compass-outline" size={18} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 2,
  },
  rightControls: {
    position: 'absolute',
    right: spacing.lg,
    gap: spacing.sm,
    zIndex: 2,
  },
});
