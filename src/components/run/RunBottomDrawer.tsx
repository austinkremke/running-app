import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';
import { RunDrawerStats } from './RunDrawerStats';
import { RunStartButton } from './RunStartButton';
import { RunStopButton } from './RunStopButton';

type RunBottomDrawerProps = {
  distanceLabel: string;
  durationLabel: string;
  paceLabel: string;
  isRecording: boolean;
  onStartRun?: () => void;
  onStopRun?: () => void;
  footer?: ReactNode;
};

export function RunBottomDrawer({
  distanceLabel,
  durationLabel,
  paceLabel,
  isRecording,
  onStartRun,
  onStopRun,
  footer,
}: RunBottomDrawerProps) {
  const insets = useSafeAreaInsets();
  const stats = [
    { icon: 'footsteps-outline' as const, value: distanceLabel, unit: ' mi', label: 'Distance' },
    { icon: 'timer-outline' as const, value: durationLabel, label: 'Duration' },
    { icon: 'speedometer-outline' as const, value: paceLabel, unit: ' /mi', label: 'Avg Pace' },
  ];

  return (
    <View style={[styles.drawer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <RunDrawerStats stats={stats} />
      {footer}
      {isRecording ? (
        <RunStopButton onPress={onStopRun} />
      ) : (
        <RunStartButton onPress={onStartRun} />
      )}
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
