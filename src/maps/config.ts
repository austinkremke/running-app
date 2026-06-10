import type { MapRegion } from './types';

export const MAP_CONFIG = {
  GPS_INTERVAL_MS: 3000,
} as const;

export const MOCK_GPS =
  process.env.EXPO_PUBLIC_MOCK_GPS === '1' || process.env.EXPO_PUBLIC_MOCK_GPS === 'true';

/** Fallback map center when no location is available yet (SF). */
export const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};
