import { isMapboxConfigured, mapboxToken } from './init';

type MapboxModule = typeof import('@rnmapbox/maps');

let nativeAvailable: boolean | null = null;
let mapboxModule: MapboxModule | null = null;
let tokenInitialized = false;

export function isMapboxNativeAvailable(): boolean {
  return getMapboxModule() !== null;
}

export function getMapboxModule(): MapboxModule | null {
  if (nativeAvailable === false) {
    return null;
  }

  if (mapboxModule) {
    return mapboxModule;
  }

  try {
    // Lazy require so Expo Go can load the app without native Mapbox linked.
    mapboxModule = require('@rnmapbox/maps') as MapboxModule;

    if (isMapboxConfigured && !tokenInitialized) {
      mapboxModule.default.setAccessToken(mapboxToken);
      tokenInitialized = true;
    }

    nativeAvailable = true;
    return mapboxModule;
  } catch {
    nativeAvailable = false;
    return null;
  }
}
