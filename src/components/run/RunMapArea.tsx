import { StyleSheet, View } from 'react-native';

import { useInitialMapRegion } from '../../hooks/useInitialMapRegion';
import { activeMapProvider } from '../../maps';
import { RunMapControls } from './RunMapControls';

type RunMapAreaProps = {
  onBack?: () => void;
};

export function RunMapArea({ onBack }: RunMapAreaProps) {
  const { region } = useInitialMapRegion();
  const MapView = activeMapProvider.MapView;

  return (
    <View style={styles.container}>
      <MapView region={region} showsUserLocation />
      <RunMapControls onBack={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
