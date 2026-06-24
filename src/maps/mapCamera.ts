import type { GpsPoint, MapRegion } from './types';

/** Convert region deltas to a Mapbox zoom level. */
export function regionToZoomLevel(region: MapRegion): number {
  const zoom = Math.log2(360 / region.latitudeDelta) - 1;
  return Math.max(2, Math.min(20, zoom));
}

export function regionToCenter(region: MapRegion): [number, number] {
  return [region.longitude, region.latitude];
}

export function regionFromRoutePoints(points: GpsPoint[], paddingFactor = 1.35): MapRegion | null {
  if (points.length === 0) return null;

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  const latitudeDelta = Math.max((maxLat - minLat) * paddingFactor, 0.00015);
  const longitudeDelta = Math.max((maxLng - minLng) * paddingFactor, 0.00015);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
