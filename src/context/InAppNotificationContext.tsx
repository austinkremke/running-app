import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  buildSoloChallengeNotification,
  InAppNotificationDrawer,
} from '../components/notification';
import { useUserId } from './AuthContext';
import {
  acceptSoloChallenge,
  declineSoloChallenge,
  getSoloChallengeStatus,
  type ReceivedSoloChallenge,
} from '../services/challengeService';
import {
  fetchTeamNotifications,
  respondToJoinRequest,
  respondToTeamInvite,
  type TeamNotification,
} from '../services/teamMembershipService';
import {
  notifyTeamNotificationsChanged,
  subscribeTeamNotifications,
} from '../services/teamNotificationBus';
import { notifyMatchRefresh, subscribeMatchRefresh } from '../services/matchRefreshBus';
import type {
  GenericInAppNotification,
  InAppNotification,
  InAppNotificationHandlers,
  SoloChallengeInAppNotification,
} from '../types/inAppNotification';

const CHALLENGE_POLL_MS = 10_000;

type InAppNotificationContextValue = {
  showNotification: (notification: InAppNotification) => void;
  dismissNotification: () => void;
  registerHandlers: (handlers: InAppNotificationHandlers) => void;
};

const InAppNotificationContext = createContext<InAppNotificationContextValue | null>(null);

export function InAppNotificationProvider({ children }: { children: ReactNode }) {
  const userId = useUserId();
  const [queue, setQueue] = useState<InAppNotification[]>([]);
  const [visible, setVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const currentRef = useRef<InAppNotification | null>(null);
  const handlersRef = useRef<InAppNotificationHandlers>({});
  const promptedChallengeIdsRef = useRef<Set<string>>(new Set());
  const promptedTeamIdsRef = useRef<Set<string>>(new Set());

  const current = queue[0] ?? null;
  currentRef.current = current;

  const dismissNotification = useCallback(() => {
    const active = currentRef.current;
    active?.onDismiss?.();

    setVisible(false);
    setActionLoading(false);

    setQueue((previous) => {
      const [, ...rest] = previous;
      if (rest.length > 0) {
        setTimeout(() => setVisible(true), 0);
      }
      return rest;
    });
  }, []);

  const showNotification = useCallback(
    (notification: InAppNotification) => {
      setQueue((previous) => {
        if (previous.some((item) => item.id === notification.id)) {
          return previous;
        }

        if (previous.length === 0) {
          setVisible(true);
          return [notification];
        }

        return [...previous, notification];
      });
    },
    [],
  );

  const registerHandlers = useCallback((handlers: InAppNotificationHandlers) => {
    handlersRef.current = handlers;
  }, []);

  const enqueueSoloChallenge = useCallback(
    (challenge: ReceivedSoloChallenge) => {
      if (promptedChallengeIdsRef.current.has(challenge.id)) {
        return;
      }

      promptedChallengeIdsRef.current.add(challenge.id);

      const notification = buildSoloChallengeNotification(challenge, {
        onAccept: async () => {
          setActionLoading(true);
          try {
            const matchId = await acceptSoloChallenge(challenge.id);
            notifyMatchRefresh();
            handlersRef.current.onSoloChallengeAccepted?.(matchId);
            dismissNotification();
          } catch (error) {
            console.warn('Could not accept challenge from notification', error);
            promptedChallengeIdsRef.current.delete(challenge.id);
          } finally {
            setActionLoading(false);
          }
        },
        onDecline: async () => {
          setActionLoading(true);
          try {
            await declineSoloChallenge(challenge.id);
            notifyMatchRefresh();
            dismissNotification();
          } catch (error) {
            console.warn('Could not decline challenge from notification', error);
            promptedChallengeIdsRef.current.delete(challenge.id);
          } finally {
            setActionLoading(false);
          }
        },
        onDismiss: () => {
          // Keep challenge id marked as prompted so we don't immediately re-prompt.
        },
      });

      showNotification(notification);
    },
    [dismissNotification, showNotification],
  );

  const enqueueTeamNotification = useCallback(
    (notification: TeamNotification) => {
      if (promptedTeamIdsRef.current.has(notification.id)) {
        return;
      }

      promptedTeamIdsRef.current.add(notification.id);

      const isInvite = notification.kind === 'invite';
      const respond = async (accept: boolean) => {
        setActionLoading(true);
        try {
          if (isInvite) {
            await respondToTeamInvite(notification.id, accept);
          } else {
            await respondToJoinRequest(notification.id, accept);
          }
          notifyTeamNotificationsChanged();
          dismissNotification();
        } catch (error) {
          console.warn('Could not respond to team notification', error);
          promptedTeamIdsRef.current.delete(notification.id);
        } finally {
          setActionLoading(false);
        }
      };

      showNotification({
        kind: 'generic',
        id: `team_${notification.id}`,
        eyebrow: isInvite ? 'Team Invite' : 'Join Request',
        title: isInvite
          ? `${notification.teamName} invited you`
          : `${notification.actorName} wants to join`,
        message: isInvite
          ? `${notification.actorName} invited you to join ${notification.teamName}.`
          : `${notification.actorName} (Lvl ${notification.actorLevel}) asked to join ${notification.teamName}.`,
        avatarUrl: notification.actorAvatarUrl,
        avatarFallbackLabel: notification.actorName.slice(0, 1).toUpperCase(),
        primaryAction: {
          label: isInvite ? 'Join' : 'Approve',
          variant: 'primary',
          onPress: () => respond(true),
        },
        secondaryAction: {
          label: 'Decline',
          variant: 'secondary',
          onPress: () => respond(false),
        },
      });
    },
    [dismissNotification, showNotification],
  );

  const syncIncomingTeamNotifications = useCallback(async () => {
    if (!userId) {
      promptedTeamIdsRef.current.clear();
      return;
    }

    try {
      const items = await fetchTeamNotifications();

      for (const item of items) {
        if (!promptedTeamIdsRef.current.has(item.id)) {
          enqueueTeamNotification(item);
        }
      }

      for (const promptedId of [...promptedTeamIdsRef.current]) {
        if (!items.some((item) => item.id === promptedId)) {
          promptedTeamIdsRef.current.delete(promptedId);
        }
      }
    } catch (error) {
      console.warn('Could not sync team notifications', error);
    }
  }, [enqueueTeamNotification, userId]);

  const syncIncomingChallenges = useCallback(async () => {
    if (!userId) {
      promptedChallengeIdsRef.current.clear();
      return;
    }

    try {
      const status = await getSoloChallengeStatus();

      for (const challenge of status.received) {
        if (!promptedChallengeIdsRef.current.has(challenge.id)) {
          enqueueSoloChallenge(challenge);
        }
      }

      for (const challengeId of [...promptedChallengeIdsRef.current]) {
        const stillPending = status.received.some((challenge) => challenge.id === challengeId);
        if (!stillPending) {
          promptedChallengeIdsRef.current.delete(challengeId);
        }
      }
    } catch (error) {
      console.warn('Could not sync incoming challenge notifications', error);
    }
  }, [enqueueSoloChallenge, userId]);

  useEffect(() => {
    if (!userId) {
      setQueue([]);
      setVisible(false);
      return;
    }

    const syncAll = () => {
      void syncIncomingChallenges();
      void syncIncomingTeamNotifications();
    };

    syncAll();

    const interval = setInterval(syncAll, CHALLENGE_POLL_MS);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncAll();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [syncIncomingChallenges, syncIncomingTeamNotifications, userId]);

  useEffect(() => {
    return subscribeMatchRefresh(() => {
      void syncIncomingChallenges();
    });
  }, [syncIncomingChallenges]);

  useEffect(() => {
    return subscribeTeamNotifications(() => {
      void syncIncomingTeamNotifications();
    });
  }, [syncIncomingTeamNotifications]);

  const value = useMemo(
    () => ({
      showNotification,
      dismissNotification,
      registerHandlers,
    }),
    [dismissNotification, registerHandlers, showNotification],
  );

  return (
    <InAppNotificationContext.Provider value={value}>
      {children}
      <InAppNotificationDrawer
        actionLoading={actionLoading}
        notification={current}
        onClose={dismissNotification}
        visible={visible && current != null}
      />
    </InAppNotificationContext.Provider>
  );
}

export function useInAppNotification() {
  const context = useContext(InAppNotificationContext);
  if (!context) {
    throw new Error('useInAppNotification must be used within InAppNotificationProvider');
  }

  return context;
}

export function useInAppNotificationOptional() {
  return useContext(InAppNotificationContext);
}

export type { GenericInAppNotification, InAppNotification, SoloChallengeInAppNotification };
