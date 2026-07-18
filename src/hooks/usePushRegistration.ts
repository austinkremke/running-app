import { useEffect } from 'react';

import { registerForPushNotifications, unregisterPushToken } from '../services/pushNotifications';

/** Requests push permission and registers the device token as soon as a user is signed in; unregisters on sign-out. */
export function usePushRegistration(userId: string | null) {
  useEffect(() => {
    if (!userId) {
      return;
    }

    registerForPushNotifications().catch((error) => {
      console.warn('Could not register for push notifications', error);
    });

    return () => {
      unregisterPushToken().catch((error) => {
        console.warn('Could not unregister push token', error);
      });
    };
  }, [userId]);
}
