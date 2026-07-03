import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useUserId } from '../context';
import {
  cancelTeamMembershipRequest,
  fetchTeamNotifications,
  hasTeamNotifications,
  respondToJoinRequest,
  respondToTeamInvite,
  type TeamNotification,
} from '../services/teamMembershipService';
import {
  notifyTeamNotificationsChanged,
  subscribeTeamNotifications,
} from '../services/teamNotificationBus';

const POLL_INTERVAL_MS = 15_000;

export function useTeamNotifications() {
  const userId = useUserId();
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setNotifications(await fetchTeamNotifications());
    } catch (error) {
      console.warn('Failed to load team notifications', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeTeamNotifications(() => {
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void refresh();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  const respond = useCallback(
    async (notification: TeamNotification, accept: boolean) => {
      setActionLoadingId(notification.id);
      try {
        if (notification.kind === 'invite') {
          await respondToTeamInvite(notification.id, accept);
        } else {
          await respondToJoinRequest(notification.id, accept);
        }
        notifyTeamNotificationsChanged();
        await refresh();
      } finally {
        setActionLoadingId(null);
      }
    },
    [refresh],
  );

  const cancel = useCallback(
    async (notificationId: string) => {
      setActionLoadingId(notificationId);
      try {
        await cancelTeamMembershipRequest(notificationId);
        notifyTeamNotificationsChanged();
        await refresh();
      } finally {
        setActionLoadingId(null);
      }
    },
    [refresh],
  );

  return {
    notifications,
    loading,
    actionLoadingId,
    hasUnread: notifications.length > 0,
    refresh,
    respond,
    cancel,
  };
}

/** Lightweight boolean indicator for the feed bell + bottom-tab badge. */
export function useHasTeamNotifications(): boolean {
  const userId = useUserId();
  const [hasUnread, setHasUnread] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setHasUnread(false);
      return;
    }

    try {
      setHasUnread(await hasTeamNotifications());
    } catch (error) {
      console.warn('Failed to check team notification indicator', error);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeTeamNotifications(() => {
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void refresh();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  return hasUnread;
}
