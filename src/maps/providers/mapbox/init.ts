export const mapboxToken = (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '').trim();

/** True when a real Mapbox public token is configured (starts with pk.). */
export const isMapboxConfigured = mapboxToken.startsWith('pk.');

/** Mapbox Standard style — same as territory-run. */
export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/standard';
