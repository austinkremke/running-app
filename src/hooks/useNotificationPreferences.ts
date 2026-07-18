import { useCallback, useEffect, useState } from 'react';

import {
  fetchNotificationPreferences,
  updateNotificationPreference,
  type NotificationCategory,
  type NotificationPreferences,
} from '../services/pushNotifications';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  likes: true,
  comments: true,
  friend_requests: true,
  friend_challenge: true,
  match_found: true,
  match_reminders: true,
  match_complete: true,
  friend_activity: true,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState<NotificationCategory | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchNotificationPreferences()
      .then((result) => {
        if (!cancelled && result) {
          setPreferences(result);
        }
      })
      .catch((error) => {
        console.warn('Could not load notification preferences', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setCategory = useCallback(
    async (category: NotificationCategory, enabled: boolean) => {
      const previous = preferences[category];
      setPreferences((current) => ({ ...current, [category]: enabled }));
      setSavingCategory(category);

      try {
        await updateNotificationPreference(category, enabled);
      } catch (error) {
        console.warn('Could not update notification preference', error);
        setPreferences((current) => ({ ...current, [category]: previous }));
      } finally {
        setSavingCategory(null);
      }
    },
    [preferences],
  );

  return { preferences, loading, savingCategory, setCategory };
}
