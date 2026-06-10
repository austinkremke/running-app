import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

const MAP_BLUE = '#3B82F6';

type RunMapPlaceholderProps = {
  onBack?: () => void;
};

export function RunMapPlaceholder({ onBack }: RunMapPlaceholderProps) {
  const insets = useSafeAreaInsets();
  const controlsTop = insets.top + spacing.lg;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: 4 }).map((__, col) => (
              <View key={col} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>

      <Pressable
        accessibilityLabel="Go back to feed"
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

      <View style={styles.marker}>
        <View style={styles.markerGlow} />
        <View style={styles.markerDot}>
          <View style={styles.markerInner} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
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
  },
  rightControls: {
    position: 'absolute',
    right: spacing.lg,
    gap: spacing.sm,
  },
  marker: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    marginLeft: -16,
    marginTop: -16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: MAP_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  markerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
});
