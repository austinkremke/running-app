import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useInitialMapRegion } from '../../hooks/useInitialMapRegion';
import { activeMapProvider } from '../../maps';
import { RunMapControls } from './RunMapControls';

type RunMapAreaProps = {
  onBack?: () => void;
};

export function RunMapArea({ onBack }: RunMapAreaProps) {
  const { region } = useInitialMapRegion();
  const [recenterSignal, setRecenterSignal] = useState(0);
  const MapView = activeMapProvider.MapView;

  return (
    <View style={styles.container}>
      <MapView region={region} recenterSignal={recenterSignal} showsUserLocation />
      <RunMapControls
        onBack={onBack}
        onRecenter={() => setRecenterSignal((count) => count + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
