import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { MAP_CONFIG, MOCK_GPS } from '../../config';
import type { GpsPoint, LocationProvider, LocationWatcher } from '../../types';

const BACKGROUND_LOCATION_TASK = 'run-off-background-location';

// Listeners registered by the active run recording — kept outside React so the
// TaskManager task (which can run after the JS context is re-woken in the
// background) always has somewhere to deliver points, even across re-renders.
const pointListeners = new Set<(point: GpsPoint) => void>();

if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('Background location task error', error);
      return;
    }

    const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
    if (!locations) return;

    for (const location of locations) {
      const point = locationToGpsPoint(location);
      pointListeners.forEach((listener) => listener(point));
    }
  });
}

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
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') return false;

    if (Platform.OS !== 'web') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn(
          'Background location permission not granted — run tracking will pause when the phone is locked.',
        );
      }
    }

    return true;
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

    pointListeners.add(onPoint);

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (!alreadyStarted) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: MAP_CONFIG.GPS_INTERVAL_MS,
        distanceInterval: MAP_CONFIG.GPS_DISTANCE_METERS,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Run Off',
          notificationBody: 'Tracking your run…',
        },
      });
    }

    const watcher: LocationWatcher = {
      stop: () => {
        pointListeners.delete(onPoint);
        if (pointListeners.size === 0) {
          Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch((error) => {
            console.warn('Failed to stop background location updates', error);
          });
        }
      },
    };

    return watcher;
  },
};
