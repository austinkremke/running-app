import { useCallback, useEffect, useState } from 'react';

import {
  readUserPreferences,
  writeUserPreferences,
  type DistanceUnit,
  type UserPreferences,
} from '../storage/userPreferencesStorage';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({ distanceUnit: 'miles' });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await readUserPreferences();
      setPreferences(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setDistanceUnit = useCallback(async (distanceUnit: DistanceUnit) => {
    const next = { distanceUnit };
    setPreferences(next);
    await writeUserPreferences(next);
  }, []);

  return {
    preferences,
    loading,
    refresh,
    setDistanceUnit,
  };
}
