import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { UserLocationDot } from '../../../components/run/UserLocationDot';
import { colors, spacing } from '../../../theme';
import { regionToCenter, regionToZoomLevel } from '../../mapCamera';
import type { MapViewProps } from '../../types';
import { isMapboxConfigured, MAPBOX_STYLE_IMPORT_CONFIG, MAPBOX_STYLE_URL } from './init';
import { getMapboxModule } from './mapboxNative';

function MapFallback({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>{title}</Text>
      <Text style={styles.fallbackBody}>{body}</Text>
    </View>
  );
}

export function MapboxMapView({
  region,
  routePoints = [],
  showsUserLocation = true,
  recenterSignal = 0,
}: MapViewProps) {
  const mapbox = getMapboxModule();
  const cameraRef = useRef<{ setCamera: (config: object) => void } | null>(null);
  const userCoordinateRef = useRef<[number, number] | null>(null);
  const [userCoordinate, setUserCoordinate] = useState<[number, number] | null>(null);
  const isTracking = routePoints.length > 0;
  const zoomLevel = useMemo(() => regionToZoomLevel(region), [region]);
  const centerCoordinate = useMemo(() => regionToCenter(region), [region]);
  const initialCameraSettings = useRef({
    centerCoordinate: regionToCenter(region),
    zoomLevel: regionToZoomLevel(region),
  }).current;

  const handleUserLocationUpdate = useCallback(
    (location: { coords?: { longitude: number; latitude: number } }) => {
      if (!location.coords) return;
      const coordinate: [number, number] = [
        location.coords.longitude,
        location.coords.latitude,
      ];
      userCoordinateRef.current = coordinate;
      setUserCoordinate(coordinate);
    },
    [],
  );

  useEffect(() => {
    if (!recenterSignal) return;

    const coordinate = userCoordinateRef.current;
    if (!coordinate) return;

    cameraRef.current?.setCamera({
      centerCoordinate: coordinate,
      zoomLevel: regionToZoomLevel(region),
      animationDuration: 500,
      animationMode: 'easeTo',
    });
  }, [recenterSignal, region]);

  const routeGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString>>(() => {
    if (routePoints.length < 2) {
      return { type: 'FeatureCollection', features: [] };
    }

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routePoints.map(
              (point) => [point.longitude, point.latitude] as [number, number],
            ),
          },
        },
      ],
    };
  }, [routePoints]);

  if (Platform.OS === 'web') {
    return (
      <MapFallback
        body="Run the iOS or Android dev build to use the map."
        title="Map unavailable on web"
      />
    );
  }

  if (!isMapboxConfigured) {
    return (
      <MapFallback
        body="Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file, then rebuild the native app."
        title="Mapbox not configured"
      />
    );
  }

  if (!mapbox) {
    return (
      <MapFallback
        body="The map requires a native dev build. Run npx expo run:ios while CocoaPods finishes, then use that build instead of Expo Go."
        title="Map unavailable in Expo Go"
      />
    );
  }

  const { Camera, LineLayer, MapView, MarkerView, ShapeSource, StyleImport, UserLocation } = mapbox;

  return (
    <MapView
      style={styles.map}
      styleURL={MAPBOX_STYLE_URL}
      projection="globe"
      pitchEnabled
      rotateEnabled
      scrollEnabled
      zoomEnabled
      attributionEnabled
      logoEnabled={false}
    >
      <StyleImport
        id="basemap"
        existing
        config={MAPBOX_STYLE_IMPORT_CONFIG}
      />

      <Camera
        ref={cameraRef}
        defaultSettings={initialCameraSettings}
        {...(isTracking
          ? {
              centerCoordinate,
              zoomLevel,
              animationDuration: 0,
            }
          : {})}
      />

      {showsUserLocation ? (
        <UserLocation visible={false} onUpdate={handleUserLocationUpdate} />
      ) : null}

      {showsUserLocation && userCoordinate ? (
        <MarkerView coordinate={userCoordinate} allowOverlap allowOverlapWithPuck>
          <UserLocationDot />
        </MarkerView>
      ) : null}

      {routeGeoJson.features.length > 0 ? (
        <ShapeSource id="run-route" shape={routeGeoJson}>
          <LineLayer
            id="run-route-line"
            style={{
              lineColor: colors.accentLime,
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  fallbackTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fallbackBody: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
