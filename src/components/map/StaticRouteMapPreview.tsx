import { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { buildStaticRouteImageUrl } from '../../maps/staticRouteImage';
import type { GpsPoint } from '../../maps/types';
import { colors } from '../../theme';

type StaticRouteMapPreviewProps = {
  routePoints: GpsPoint[];
  style?: StyleProp<ViewStyle>;
};

// Renders the route as a plain static image (Mapbox Static Images API), not
// a live native MapView — the feed can show many of these at once, and one
// live GL map view per card was piling up native memory fast enough for iOS
// to jetsam-kill the app when scrolling/navigating quickly.
export function StaticRouteMapPreview({ routePoints, style }: StaticRouteMapPreviewProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    }
  }

  if (routePoints.length < 2) {
    return <View style={[styles.placeholder, style]} />;
  }

  const imageUrl = size ? buildStaticRouteImageUrl(routePoints, size.width, size.height) : null;

  return (
    <View pointerEvents="none" onLayout={handleLayout} style={[styles.container, style]}>
      {imageUrl ? <Image resizeMode="cover" source={{ uri: imageUrl }} style={styles.fill} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.surfaceElevated,
  },
});
