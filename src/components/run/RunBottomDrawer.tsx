import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';
import { RunDrawerStats } from './RunDrawerStats';
import { RunStartButton } from './RunStartButton';

type RunBottomDrawerProps = {
  onStartRun?: () => void;
  footer?: ReactNode;
};

export function RunBottomDrawer({ onStartRun, footer }: RunBottomDrawerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.drawer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <RunDrawerStats />
      {footer}
      <RunStartButton onPress={onStartRun} />
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
