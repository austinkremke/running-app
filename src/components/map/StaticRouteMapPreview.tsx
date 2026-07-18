import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { activeMapProvider, DEFAULT_MAP_REGION } from '../../maps';
import { regionFromRoutePoints } from '../../maps/mapCamera';
import type { GpsPoint } from '../../maps/types';
import { colors } from '../../theme';

type StaticRouteMapPreviewProps = {
  routePoints: GpsPoint[];
  style?: StyleProp<ViewStyle>;
};

export function StaticRouteMapPreview({ routePoints, style }: StaticRouteMapPreviewProps) {
  // This is a completed run's static thumbnail — it renders the route itself,
  // never the viewer's live location, so it must not trigger a location
  // permission prompt. DEFAULT_MAP_REGION only matters as an unreachable
  // fallback since routePoints.length < 2 already short-circuits below.
  const region = useMemo(() => regionFromRoutePoints(routePoints, 1.08) ?? DEFAULT_MAP_REGION, [routePoints]);
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
