import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useInitialMapRegion } from '../../hooks/useInitialMapRegion';
import { activeMapProvider } from '../../maps';
import type { GpsPoint } from '../../maps/types';
import { RunMapControls } from './RunMapControls';

type RunMapAreaProps = {
  onBack?: () => void;
  routePoints?: GpsPoint[];
  isTracking?: boolean;
};

export function RunMapArea({ onBack, routePoints = [], isTracking = false }: RunMapAreaProps) {
  const { region } = useInitialMapRegion();
  const [recenterSignal, setRecenterSignal] = useState(0);
  const MapView = activeMapProvider.MapView;

  return (
    <View style={styles.container}>
      <MapView
        followRoute={isTracking}
        region={region}
        recenterSignal={recenterSignal}
        routePoints={isTracking ? routePoints : []}
        showsUserLocation
      />
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
