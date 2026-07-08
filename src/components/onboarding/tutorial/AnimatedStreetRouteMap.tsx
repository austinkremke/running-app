import { Platform, StyleSheet, Text, View } from 'react-native';

import { getMapboxModule } from '../../../maps/providers/mapbox/mapboxNative';
import { isMapboxConfigured, MAPBOX_STYLE_IMPORT_CONFIG, MAPBOX_STYLE_URL } from '../../../maps/providers/mapbox/init';
import { colors, spacing } from '../../../theme';

export type LatLng = { lat: number; lng: number };

// Downtown Dallas' street grid runs roughly NE/SW and NW/SE (Main, Elm,
// Commerce vs. Akard, Field, Griffin) — routes below walk that same
// ~45°-rotated grid block by block instead of an arbitrary curve.
const BLOCK_NE: LatLng = { lat: 0.00075, lng: 0.00075 };
const BLOCK_NW: LatLng = { lat: 0.00075, lng: -0.00075 };
const POINTS_PER_BLOCK = 6;

function addVec(point: LatLng, vec: LatLng, count = 1): LatLng {
  return { lat: point.lat + vec.lat * count, lng: point.lng + vec.lng * count };
}

/** Walks a sequence of (direction, block-count) legs, subdividing each into evenly-spaced points. */
export function buildBlockRoute(start: LatLng, legs: Array<[LatLng, number]>): LatLng[] {
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

export const BLOCK_DIRECTIONS = {
  ne: BLOCK_NE,
  nw: BLOCK_NW,
  sw: { lat: -BLOCK_NE.lat, lng: -BLOCK_NE.lng },
  se: { lat: -BLOCK_NW.lat, lng: -BLOCK_NW.lng },
};

const MAP_REGION = { latitude: 32.786, longitude: -96.799 };

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

function routeLayer(id: string, color: string, geoJson: GeoJSON.FeatureCollection<GeoJSON.LineString>, mapbox: NonNullable<ReturnType<typeof getMapboxModule>>) {
  if (geoJson.features.length === 0) return null;
  const { LineLayer, ShapeSource } = mapbox;

  return (
    <ShapeSource id={`${id}-source`} key={id} shape={geoJson}>
      <LineLayer
        id={`${id}-glow`}
        style={{
          lineColor: color,
          lineWidth: 11,
          lineOpacity: 0.45,
          lineBlur: 2,
          lineCap: 'round',
          lineJoin: 'round',
          lineEmissiveStrength: 1,
        }}
      />
      <LineLayer
        id={`${id}-line`}
        style={{
          lineColor: color,
          lineWidth: 5,
          lineCap: 'round',
          lineJoin: 'round',
          lineEmissiveStrength: 1,
        }}
      />
    </ShapeSource>
  );
}

function MapFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>Downtown Dallas</Text>
      <Text style={styles.fallbackBody}>Run the native app build to see the live map preview.</Text>
    </View>
  );
}

type AnimatedStreetRouteMapProps = {
  greenRoute: LatLng[];
  purpleRoute: LatLng[];
  greenRevealCount: number;
  purpleRevealCount: number;
};

export function AnimatedStreetRouteMap({
  greenRoute,
  purpleRoute,
  greenRevealCount,
  purpleRevealCount,
}: AnimatedStreetRouteMapProps) {
  const mapbox = getMapboxModule();

  if (Platform.OS === 'web' || !isMapboxConfigured || !mapbox) {
    return (
      <View style={styles.container}>
        <MapFallback />
      </View>
    );
  }

  const { Camera, MapView, StyleImport } = mapbox;
  const greenGeoJson = toLineString(greenRoute.slice(0, greenRevealCount));
  const purpleGeoJson = toLineString(purpleRoute.slice(0, purpleRevealCount));

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

        {routeLayer('tutorial-green-route', colors.accentLime, greenGeoJson, mapbox)}
        {routeLayer('tutorial-purple-route', colors.accentPurple, purpleGeoJson, mapbox)}
      </MapView>

      <View style={styles.locationChip}>
        <Text style={styles.locationChipLabel}>Downtown Dallas, TX</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 240,
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
