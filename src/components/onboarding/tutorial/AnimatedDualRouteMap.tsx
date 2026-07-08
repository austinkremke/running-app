import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { getMapboxModule } from '../../../maps/providers/mapbox/mapboxNative';
import { isMapboxConfigured, MAPBOX_STYLE_IMPORT_CONFIG, MAPBOX_STYLE_URL } from '../../../maps/providers/mapbox/init';
import { colors, spacing } from '../../../theme';

type LatLng = { lat: number; lng: number };

// Downtown Dallas' street grid runs roughly NE/SW and NW/SE (Main, Elm,
// Commerce vs. Akard, Field, Griffin) — build routes as block-by-block
// turns along that same ~45°-rotated grid instead of arbitrary curves.
const BLOCK_NE: LatLng = { lat: 0.00075, lng: 0.00075 };
const BLOCK_NW: LatLng = { lat: 0.00075, lng: -0.00075 };
const POINTS_PER_BLOCK = 6;

function addVec(point: LatLng, vec: LatLng, count = 1): LatLng {
  return { lat: point.lat + vec.lat * count, lng: point.lng + vec.lng * count };
}

/** Walks a sequence of (direction, block-count) legs, subdividing each leg into evenly-spaced points. */
function buildBlockRoute(start: LatLng, legs: Array<[LatLng, number]>): LatLng[] {
  const points: LatLng[] = [start];
  let cursor = start;

  for (const [direction, blocks] of legs) {
    const legEnd = addVec(cursor, direction, blocks);
    const steps = POINTS_PER_BLOCK * blocks;

    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      points.push({
        lat: cursor.lat + (legEnd.lat - cursor.lat) * t,
        lng: cursor.lng + (legEnd.lng - cursor.lng) * t,
      });
    }

    cursor = legEnd;
  }

  return points;
}

// Two nearby rectangular block loops around Main St / Klyde Warren Park —
// distinct blocks, same grid, so the routes read as two real runners
// covering different streets at the same time.
const USER_ROUTE: LatLng[] = buildBlockRoute(
  { lat: 32.7845, lng: -96.802 },
  [
    [BLOCK_NE, 3],
    [BLOCK_NW, 2],
    [{ lat: -BLOCK_NE.lat, lng: -BLOCK_NE.lng }, 3],
    [{ lat: -BLOCK_NW.lat, lng: -BLOCK_NW.lng }, 2],
  ],
);

const OPPONENT_ROUTE: LatLng[] = buildBlockRoute(
  { lat: 32.783, lng: -96.7955 },
  [
    [BLOCK_NW, 3],
    [{ lat: -BLOCK_NE.lat, lng: -BLOCK_NE.lng }, 2],
    [{ lat: -BLOCK_NW.lat, lng: -BLOCK_NW.lng }, 3],
    [BLOCK_NE, 2],
  ],
);

const MAP_REGION = {
  latitude: 32.786,
  longitude: -96.799,
  latitudeDelta: 0.021,
  longitudeDelta: 0.021,
};

const TOTAL_STEPS = Math.max(USER_ROUTE.length, OPPONENT_ROUTE.length);
const REVEAL_INTERVAL_MS = 900 / TOTAL_STEPS;

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
    const interval = setInterval(() => {
      setRevealCount((previous) => {
        const next = previous + 1;
        if (next >= TOTAL_STEPS && !doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
        return next;
      });
    }, REVEAL_INTERVAL_MS);

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
            zoomLevel: 15,
          }}
        />

        {userGeoJson.features.length > 0 ? (
          <ShapeSource id="tutorial-user-route" shape={userGeoJson}>
            <LineLayer
              id="tutorial-user-route-glow"
              style={{
                lineColor: colors.accentLime,
                lineWidth: 11,
                lineOpacity: 0.45,
                lineBlur: 2,
                lineCap: 'round',
                lineJoin: 'round',
                lineEmissiveStrength: 1,
              }}
            />
            <LineLayer
              id="tutorial-user-route-line"
              style={{
                lineColor: colors.accentLime,
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                lineEmissiveStrength: 1,
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
                lineWidth: 11,
                lineOpacity: 0.45,
                lineBlur: 2,
                lineCap: 'round',
                lineJoin: 'round',
                lineEmissiveStrength: 1,
              }}
            />
            <LineLayer
              id="tutorial-opponent-route-line"
              style={{
                lineColor: colors.accentPurple,
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                lineEmissiveStrength: 1,
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
