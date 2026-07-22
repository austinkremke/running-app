export const mapboxToken = (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '').trim();

/** True when a real Mapbox public token is configured (starts with pk.). */
export const isMapboxConfigured = mapboxToken.startsWith('pk.');

/** Mapbox Standard style — same as run-off. */
export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/standard';

/** Dark theme for Mapbox Standard (day | dusk | dawn | night) — POI/place/transit/road
 * labels (addresses, business names, street names, etc.) turned off to keep the
 * route the visual focus instead of map clutter. */
export const MAPBOX_STYLE_IMPORT_CONFIG = {
  lightPreset: 'night',
  showPointOfInterestLabels: false,
  showPlaceLabels: false,
  showTransitLabels: false,
  showRoadLabels: false,
} as const;
