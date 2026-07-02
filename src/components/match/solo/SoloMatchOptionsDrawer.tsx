import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheetDrawer } from '../../drawer';
import { colors, spacing } from '../../../theme';

type SoloMatchOptionsDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onQuitMatch: () => void;
};

export function SoloMatchOptionsDrawer({
  visible,
  onClose,
  onQuitMatch,
}: SoloMatchOptionsDrawerProps) {
  return (
    <BottomSheetDrawer
      accessibilityLabel="Close match options"
      heightRatio={0.28}
      onClose={onClose}
      visible={visible}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Match Options</Text>

        <Pressable
          accessibilityLabel="Quit match"
          accessibilityRole="button"
          onPress={onQuitMatch}
          style={({ pressed }) => [styles.option, pressed && styles.pressed]}
        >
          <Text style={styles.optionLabel}>Quit Match</Text>
          <Text style={styles.optionSubtext}>Forfeit and count as a loss</Text>
        </Pressable>
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  option: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  optionLabel: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  optionSubtext: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.85,
  },
});
