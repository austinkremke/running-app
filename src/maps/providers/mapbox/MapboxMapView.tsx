import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { RouteEndpointDot } from '../../../components/run/RouteEndpointDot';
import { UserLocationDot } from '../../../components/run/UserLocationDot';
import { colors, spacing } from '../../../theme';
import { regionToCenter, regionToZoomLevel } from '../../mapCamera';
import type { MapViewProps } from '../../types';
import { isMapboxConfigured, MAPBOX_STYLE_IMPORT_CONFIG, MAPBOX_STYLE_URL } from './init';
import { getMapboxModule } from './mapboxNative';

const ROUTE_LINE_COLOR = colors.accentLime;
const ROUTE_FIT_PADDING = 14;

function expandBounds(
  ne: [number, number],
  sw: [number, number],
  minSpan = 0.00012,
): { ne: [number, number]; sw: [number, number] } {
  const nextNe: [number, number] = [...ne];
  const nextSw: [number, number] = [...sw];
  const lngSpan = nextNe[0] - nextSw[0];
  const latSpan = nextNe[1] - nextSw[1];

  if (lngSpan < minSpan) {
    const pad = (minSpan - lngSpan) / 2;
    nextNe[0] += pad;
    nextSw[0] -= pad;
  }

  if (latSpan < minSpan) {
    const pad = (minSpan - latSpan) / 2;
    nextNe[1] += pad;
    nextSw[1] -= pad;
  }

  return { ne: nextNe, sw: nextSw };
}

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
  followRoute = false,
  showRouteEndpoints = false,
  interactive = false,
  recenterSignal = 0,
}: MapViewProps) {
  const mapbox = getMapboxModule();
  const cameraRef = useRef<{ setCamera: (config: object) => void; fitBounds: (...args: unknown[]) => void } | null>(null);
  // Guards against dispatching imperative camera commands before the native
  // Camera view has registered (or after this component has unmounted) —
  // without this, @rnmapbox/maps retries the dispatch for ~10s and then
  // throws an unhandled "Could not find view with tag ... in
  // updateCameraStop" rejection, which can surface on a totally different
  // screen since the retry outlives the component that triggered it.
  const mapReadyRef = useRef(false);
  const isMountedRef = useRef(true);
  const userCoordinateRef = useRef<[number, number] | null>(null);
  const [userCoordinate, setUserCoordinate] = useState<[number, number] | null>(null);
  const isRoutePreview = showRouteEndpoints && !interactive;
  const zoomLevel = useMemo(() => regionToZoomLevel(region), [region]);
  const centerCoordinate = useMemo(() => regionToCenter(region), [region]);
  const initialCameraSettings = useRef({
    centerCoordinate: regionToCenter(region),
    zoomLevel: regionToZoomLevel(region),
  }).current;

  const routeStart = routePoints[0] ?? null;
  const routeEnd = routePoints.length > 1 ? routePoints[routePoints.length - 1] : null;

  const fitRouteToViewport = useCallback(() => {
    if (!mapReadyRef.current || !isMountedRef.current) return;
    if (!showRouteEndpoints || routePoints.length < 2) return;

    const lngs = routePoints.map((point) => point.longitude);
    const lats = routePoints.map((point) => point.latitude);
    const { ne, sw } = expandBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
    );

    cameraRef.current?.fitBounds(
      ne,
      sw,
      [ROUTE_FIT_PADDING, ROUTE_FIT_PADDING, ROUTE_FIT_PADDING, ROUTE_FIT_PADDING],
      0,
    );
  }, [routePoints, showRouteEndpoints]);

  const handleMapReady = useCallback(() => {
    mapReadyRef.current = true;
    if (!isMountedRef.current) return;

    if (!followRoute && !showRouteEndpoints) {
      cameraRef.current?.setCamera({
        centerCoordinate,
        zoomLevel,
        animationDuration: 0,
      });
    }

    fitRouteToViewport();
  }, [centerCoordinate, fitRouteToViewport, followRoute, showRouteEndpoints, zoomLevel]);

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
    if (!mapReadyRef.current || !isMountedRef.current) return;

    const coordinate = userCoordinateRef.current;
    if (!coordinate) return;

    cameraRef.current?.setCamera({
      centerCoordinate: coordinate,
      zoomLevel: regionToZoomLevel(region),
      animationDuration: 500,
      animationMode: 'easeTo',
    });
  }, [recenterSignal, region]);

  // `defaultSettings` only applies once at mount, but the real device location
  // usually resolves a moment after first paint (async permission + GPS fix),
  // so the very first `region` is often a fallback. Jump the camera whenever
  // region changes so the map locks onto the real location as soon as it's ready.
  // Route-preview screens already fit-to-bounds via fitRouteToViewport, so this
  // is scoped to the plain live-location map (starting/recording a run).
  useEffect(() => {
    if (followRoute || showRouteEndpoints) return;
    if (!mapReadyRef.current || !isMountedRef.current) return;

    cameraRef.current?.setCamera({
      centerCoordinate,
      zoomLevel,
      animationDuration: 0,
    });
  }, [centerCoordinate, followRoute, showRouteEndpoints, zoomLevel]);

  useEffect(() => {
    fitRouteToViewport();
  }, [fitRouteToViewport]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      pitchEnabled={!isRoutePreview}
      rotateEnabled={!isRoutePreview}
      scrollEnabled={!isRoutePreview}
      zoomEnabled={!isRoutePreview}
      attributionEnabled={false}
      logoEnabled={false}
      scaleBarEnabled={false}
      onDidFinishLoadingMap={handleMapReady}
    >
      <StyleImport
        id="basemap"
        existing
        config={MAPBOX_STYLE_IMPORT_CONFIG}
      />

      <Camera
        ref={cameraRef}
        defaultSettings={initialCameraSettings}
        {...(followRoute
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
            id="run-route-glow"
            style={{
              lineColor: ROUTE_LINE_COLOR,
              lineWidth: 8,
              lineOpacity: 0.35,
              lineCap: 'round',
              lineJoin: 'round',
              lineEmissiveStrength: 1,
            }}
          />
          <LineLayer
            id="run-route-line"
            style={{
              lineColor: ROUTE_LINE_COLOR,
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
              lineEmissiveStrength: 1,
            }}
          />
        </ShapeSource>
      ) : null}

      {showRouteEndpoints && routeStart ? (
        <MarkerView
          coordinate={[routeStart.longitude, routeStart.latitude]}
          allowOverlap
          allowOverlapWithPuck
        >
          <RouteEndpointDot />
        </MarkerView>
      ) : null}

      {showRouteEndpoints && routeEnd ? (
        <MarkerView
          coordinate={[routeEnd.longitude, routeEnd.latitude]}
          allowOverlap
          allowOverlapWithPuck
        >
          <RouteEndpointDot />
        </MarkerView>
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
