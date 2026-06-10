import { mapboxProvider } from './providers/mapbox/mapboxProvider';
import { expoLocationProvider } from './providers/expo-location/locationProvider';
import type { LocationProvider, MapProvider } from './types';

/** Swap this to change the map rendering provider. */
export const activeMapProvider: MapProvider = mapboxProvider;

/** Swap this to change the GPS tracking provider. */
export const activeLocationProvider: LocationProvider = expoLocationProvider;
