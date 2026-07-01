import AsyncStorage from '@react-native-async-storage/async-storage';

export type DistanceUnit = 'miles' | 'kilometers';

const STORAGE_KEY = 'runoff:user-preferences:v1';

export type UserPreferences = {
  distanceUnit: DistanceUnit;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  distanceUnit: 'miles',
};

export async function readUserPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      distanceUnit:
        parsed.distanceUnit === 'kilometers' ? 'kilometers' : DEFAULT_PREFERENCES.distanceUnit,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function writeUserPreferences(preferences: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
