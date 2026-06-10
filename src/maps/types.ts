import type { ComponentType } from 'react';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type GpsPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
};

export type MapViewProps = {
  region: MapRegion;
  routePoints?: GpsPoint[];
  showsUserLocation?: boolean;
};

export type LocationWatcher = {
  stop: () => void;
};

export interface MapProvider {
  id: string;
  isConfigured: () => boolean;
  MapView: ComponentType<MapViewProps>;
}

export interface LocationProvider {
  id: string;
  requestPermissions: () => Promise<boolean>;
  getCurrentPosition: () => Promise<GpsPoint | null>;
  watchPosition: (onPoint: (point: GpsPoint) => void) => Promise<LocationWatcher>;
}
