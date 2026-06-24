import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

/** Clears the Mapbox scale bar in the top-left corner. */
const MAP_SCALE_CLEARANCE = 52;

type RunMapControlsProps = {
  onBack?: () => void;
  onRecenter?: () => void;
};

export function RunMapControls({ onBack, onRecenter }: RunMapControlsProps) {
  const insets = useSafeAreaInsets();
  const controlsTop = insets.top + spacing.lg;
  const backButtonTop = controlsTop + MAP_SCALE_CLEARANCE;

  return (
    <>
      <Pressable
        accessibilityLabel="Go back"
        onPress={onBack}
        style={[styles.mapButton, styles.backButton, { top: backButtonTop }]}
      >
        <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
      </Pressable>

      <Pressable
        accessibilityLabel="Center on my location"
        onPress={onRecenter}
        style={[styles.mapButton, styles.locateButton, { top: controlsTop }]}
      >
        <Ionicons color={colors.textPrimary} name="locate" size={18} />
      </Pressable>
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
  locateButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 2,
  },
});
