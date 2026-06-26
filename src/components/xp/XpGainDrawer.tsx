import { Pressable, StyleSheet, Text } from 'react-native';

import type { XpGainEvent } from '../../mock';
import { colors, spacing } from '../../theme';
import { BottomSheetDrawer } from '../drawer';
import { XpGainContent } from './XpGainContent';

type XpGainDrawerProps = {
  visible: boolean;
  event: XpGainEvent | null;
  onClose: () => void;
};

export function XpGainDrawer({ visible, event, onClose }: XpGainDrawerProps) {
  if (!event) {
    return null;
  }

  return (
    <BottomSheetDrawer
      accessibilityLabel="Close XP gain"
      footer={
        <Pressable
          accessibilityLabel="Continue"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        >
          <Text style={styles.continueLabel}>Continue</Text>
        </Pressable>
      }
      heightRatio={0.78}
      onClose={onClose}
      visible={visible}
    >
      <XpGainContent event={event} visible={visible} />
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  continueLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.9,
  },
});
