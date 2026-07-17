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
  fetchFriendRequestNotifications,
  hasFriendRequestNotifications,
  respondToFriendRequest,
  type FriendRequestNotification,
} from '../services/friendRequestService';
import {
  notifyTeamNotificationsChanged,
  subscribeTeamNotifications,
} from '../services/teamNotificationBus';

export type AppNotification = TeamNotification | FriendRequestNotification;

const POLL_INTERVAL_MS = 15_000;

export function useTeamNotifications() {
  const userId = useUserId();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const [team, friend] = await Promise.all([
        fetchTeamNotifications(),
        fetchFriendRequestNotifications(),
      ]);
      const merged: AppNotification[] = [...team, ...friend].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setNotifications(merged);
    } catch (error) {
      console.warn('Failed to load notifications', error);
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
    async (notification: AppNotification, accept: boolean) => {
      setActionLoadingId(notification.id);
      try {
        if (notification.kind === 'invite') {
          await respondToTeamInvite(notification.id, accept);
        } else if (notification.kind === 'request') {
          await respondToJoinRequest(notification.id, accept);
        } else {
          await respondToFriendRequest(notification.id, accept);
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
      const [team, friend] = await Promise.all([
        hasTeamNotifications(),
        hasFriendRequestNotifications(),
      ]);
      setHasUnread(team || friend);
    } catch (error) {
      console.warn('Failed to check notification indicator', error);
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
