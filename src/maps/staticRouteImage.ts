import { colors } from '../theme';
import { encodePolyline } from './encodePolyline';
import { mapboxToken } from './providers/mapbox/init';
import type { GpsPoint } from './types';

const ROUTE_LINE_COLOR_HEX = colors.accentLime.replace('#', '');
// The live map's `mapbox/standard` style isn't supported by the Static
// Images API (400s with "Unsupported rasterarray tileset format" — it needs
// a classic raster-compatible style instead).
const STATIC_STYLE_PATH = 'mapbox/navigation-night-v1';

/**
 * Mapbox Static Images API URL for a route thumbnail — a plain image, not a
 * live native MapView. The feed renders one of these per run card; using a
 * real interactive MapView per card piles up native GL map resources fast
 * enough that iOS jetsam-kills the app under memory pressure when scrolling
 * or navigating quickly (observed as a silent, log-less crash).
 */
export function buildStaticRouteImageUrl(
  routePoints: GpsPoint[],
  widthPx: number,
  heightPx: number,
): string | null {
  if (routePoints.length < 2 || !mapboxToken) return null;

  const encoded = encodeURIComponent(encodePolyline(routePoints));
  const overlay = `path-4+${ROUTE_LINE_COLOR_HEX}-1(${encoded})`;
  const width = Math.round(Math.max(1, Math.min(1280, widthPx)));
  const height = Math.round(Math.max(1, Math.min(1280, heightPx)));

  return (
    `https://api.mapbox.com/styles/v1/${STATIC_STYLE_PATH}/static/${overlay}/auto/${width}x${height}@2x` +
    `?padding=24&access_token=${mapboxToken}`
  );
}
