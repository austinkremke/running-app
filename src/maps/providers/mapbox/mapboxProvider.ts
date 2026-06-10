import type { MapProvider } from '../../types';
import { MapboxMapView } from './MapboxMapView';
import { isMapboxConfigured } from './init';
import { isMapboxNativeAvailable } from './mapboxNative';

export const mapboxProvider: MapProvider = {
  id: 'mapbox',
  isConfigured: () => isMapboxConfigured && isMapboxNativeAvailable(),
  MapView: MapboxMapView,
};
