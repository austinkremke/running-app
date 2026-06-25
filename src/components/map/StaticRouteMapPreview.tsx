import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useInitialMapRegion } from '../../hooks/useInitialMapRegion';
import { activeMapProvider } from '../../maps';
import { regionFromRoutePoints } from '../../maps/mapCamera';
import type { GpsPoint } from '../../maps/types';
import { colors } from '../../theme';

type StaticRouteMapPreviewProps = {
  routePoints: GpsPoint[];
  style?: StyleProp<ViewStyle>;
};

export function StaticRouteMapPreview({ routePoints, style }: StaticRouteMapPreviewProps) {
  const { region: initialRegion } = useInitialMapRegion();
  const region = useMemo(
    () => regionFromRoutePoints(routePoints, 1.08) ?? initialRegion,
    [initialRegion, routePoints],
  );
  const MapView = activeMapProvider.MapView;

  if (routePoints.length < 2) {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <MapView
        followRoute={false}
        region={region}
        routePoints={routePoints}
        showRouteEndpoints
        showsUserLocation={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  placeholder: {
    backgroundColor: colors.surfaceElevated,
  },
});
