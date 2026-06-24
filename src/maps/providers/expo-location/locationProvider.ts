import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { MAP_CONFIG, MOCK_GPS } from '../../config';
import type { GpsPoint, LocationProvider, LocationWatcher } from '../../types';

async function shouldUseMockGps(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  if (Device.isDevice) return false;
  return MOCK_GPS;
}

function locationToGpsPoint(position: Location.LocationObject): GpsPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    speed: position.coords.speed,
    heading: position.coords.heading,
    timestamp: new Date(position.timestamp).toISOString(),
  };
}

/** ~0.55 mi rectangular loop for simulator testing. */
function mockPoint(index: number): GpsPoint {
  const baseLat = 37.7749;
  const baseLng = -122.4194;
  const offsets = [
    [0, 0],
    [0.004, 0],
    [0.004, 0.004],
    [0, 0.004],
    [0, 0],
  ];
  const step = index % offsets.length;
  const [dLat, dLng] = offsets[step];
  return {
    latitude: baseLat + dLat,
    longitude: baseLng + dLng,
    accuracy: 5,
    timestamp: new Date().toISOString(),
  };
}

export const expoLocationProvider: LocationProvider = {
  id: 'expo-location',

  async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentPosition() {
    if (await shouldUseMockGps()) {
      return mockPoint(0);
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return locationToGpsPoint(position);
  },

  async watchPosition(onPoint) {
    if (await shouldUseMockGps()) {
      let index = 0;
      const timer = setInterval(() => {
        onPoint(mockPoint(index));
        index += 1;
      }, MAP_CONFIG.GPS_INTERVAL_MS);
      return { stop: () => clearInterval(timer) };
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: MAP_CONFIG.GPS_INTERVAL_MS,
        distanceInterval: MAP_CONFIG.GPS_DISTANCE_METERS,
      },
      (position) => onPoint(locationToGpsPoint(position)),
    );

    return { stop: () => subscription.remove() };
  },
};
