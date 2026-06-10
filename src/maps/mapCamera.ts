import type { MapRegion } from './types';

/** Convert region deltas to a Mapbox zoom level. */
export function regionToZoomLevel(region: MapRegion): number {
  const zoom = Math.log2(360 / region.latitudeDelta) - 1;
  return Math.max(2, Math.min(20, zoom));
}

export function regionToCenter(region: MapRegion): [number, number] {
  return [region.longitude, region.latitude];
}
