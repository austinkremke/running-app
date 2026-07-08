import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { getMapboxModule } from '../../../maps/providers/mapbox/mapboxNative';
import { isMapboxConfigured, MAPBOX_STYLE_IMPORT_CONFIG, MAPBOX_STYLE_URL } from '../../../maps/providers/mapbox/init';
import { colors, spacing } from '../../../theme';

type LatLng = { lat: number; lng: number };

// A pair of loops through downtown Dallas (Klyde Warren Park / Main St
// financial district) — close enough to be "the same run" but distinct
// blocks, so the two routes read clearly on the map.
const USER_ROUTE: LatLng[] = [
  { lat: 32.7891, lng: -96.8005 },
  { lat: 32.7885, lng: -96.7985 },
  { lat: 32.7865, lng: -96.7975 },
  { lat: 32.7845, lng: -96.7965 },
  { lat: 32.783, lng: -96.799 },
  { lat: 32.7845, lng: -96.8015 },
  { lat: 32.787, lng: -96.802 },
  { lat: 32.7891, lng: -96.8005 },
];

const OPPONENT_ROUTE: LatLng[] = [
  { lat: 32.7895, lng: -96.796 },
  { lat: 32.7875, lng: -96.794 },
  { lat: 32.7855, lng: -96.793 },
  { lat: 32.7835, lng: -96.7945 },
  { lat: 32.782, lng: -96.7965 },
  { lat: 32.7835, lng: -96.7985 },
  { lat: 32.786, lng: -96.7995 },
  { lat: 32.7895, lng: -96.796 },
];

const MAP_REGION = {
  latitude: 32.786,
  longitude: -96.7975,
  latitudeDelta: 0.019,
  longitudeDelta: 0.019,
};

const REVEAL_STEP_MS = 130;

function toLineString(points: LatLng[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  if (points.length < 2) {
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
          coordinates: points.map((point) => [point.lng, point.lat]),
        },
      },
    ],
  };
}

function MapFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>Downtown Dallas</Text>
      <Text style={styles.fallbackBody}>Run the native app build to see the live map preview.</Text>
    </View>
  );
}

type AnimatedDualRouteMapProps = {
  onDone?: () => void;
};

export function AnimatedDualRouteMap({ onDone }: AnimatedDualRouteMapProps) {
  const mapbox = getMapboxModule();
  const [revealCount, setRevealCount] = useState(1);
  const doneRef = useRef(false);

  useEffect(() => {
    const totalSteps = Math.max(USER_ROUTE.length, OPPONENT_ROUTE.length);
    const interval = setInterval(() => {
      setRevealCount((previous) => {
        const next = previous + 1;
        if (next >= totalSteps && !doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
        return next;
      });
    }, REVEAL_STEP_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userGeoJson = useMemo(
    () => toLineString(USER_ROUTE.slice(0, revealCount)),
    [revealCount],
  );
  const opponentGeoJson = useMemo(
    () => toLineString(OPPONENT_ROUTE.slice(0, revealCount)),
    [revealCount],
  );

  if (Platform.OS === 'web' || !isMapboxConfigured || !mapbox) {
    return (
      <View style={styles.container}>
        <MapFallback />
      </View>
    );
  }

  const { Camera, LineLayer, MapView, ShapeSource, StyleImport } = mapbox;

  return (
    <View style={styles.container}>
      <MapView
        attributionEnabled={false}
        logoEnabled={false}
        pitchEnabled={false}
        projection="globe"
        rotateEnabled={false}
        scrollEnabled={false}
        style={styles.map}
        styleURL={MAPBOX_STYLE_URL}
        zoomEnabled={false}
      >
        <StyleImport config={MAPBOX_STYLE_IMPORT_CONFIG} existing id="basemap" />

        <Camera
          defaultSettings={{
            centerCoordinate: [MAP_REGION.longitude, MAP_REGION.latitude],
            zoomLevel: 14.3,
          }}
        />

        {userGeoJson.features.length > 0 ? (
          <ShapeSource id="tutorial-user-route" shape={userGeoJson}>
            <LineLayer
              id="tutorial-user-route-glow"
              style={{
                lineColor: colors.accentLime,
                lineWidth: 8,
                lineOpacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <LineLayer
              id="tutorial-user-route-line"
              style={{
                lineColor: colors.accentLime,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        ) : null}

        {opponentGeoJson.features.length > 0 ? (
          <ShapeSource id="tutorial-opponent-route" shape={opponentGeoJson}>
            <LineLayer
              id="tutorial-opponent-route-glow"
              style={{
                lineColor: colors.accentPurple,
                lineWidth: 8,
                lineOpacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <LineLayer
              id="tutorial-opponent-route-line"
              style={{
                lineColor: colors.accentPurple,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        ) : null}
      </MapView>

      <View style={styles.locationChip}>
        <Text style={styles.locationChipLabel}>Downtown Dallas, TX</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  locationChip: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(5, 7, 11, 0.72)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  locationChipLabel: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  fallbackTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  fallbackBody: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
