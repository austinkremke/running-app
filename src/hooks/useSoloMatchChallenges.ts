import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useUserId } from '../context';
import {
  acceptSoloChallenge,
  cancelSoloChallenge,
  declineSoloChallenge,
  getSoloChallengeStatus,
  sendSoloChallenge,
  type SoloChallengeStatus,
} from '../services/challengeService';
import { notifyMatchRefresh } from '../services/matchRefreshBus';

const CHALLENGE_POLL_MS = 10_000;

const EMPTY_STATUS: SoloChallengeStatus = { sent: null, received: [] };

export function useSoloMatchChallenges() {
  const userId = useUserId();
  const [status, setStatus] = useState<SoloChallengeStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setStatus(EMPTY_STATUS);
      setLoading(false);
      return;
    }

    try {
      setStatus(await getSoloChallengeStatus());
      setError(null);
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load challenges.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, CHALLENGE_POLL_MS);

    return () => clearInterval(interval);
  }, [refresh]);

  const sendChallenge = useCallback(
    async (friendUserId: string) => {
      setActionLoading(true);
      setError(null);

      try {
        await sendSoloChallenge(friendUserId);
        await refresh();
        notifyMatchRefresh();
      } catch (sendError) {
        const message =
          sendError instanceof Error ? sendError.message : 'Could not send challenge.';
        setError(message);
        throw sendError;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const acceptChallenge = useCallback(
    async (challengeId: string) => {
      setActionLoading(true);
      setError(null);

      try {
        const matchId = await acceptSoloChallenge(challengeId);
        await refresh();
        notifyMatchRefresh();
        return matchId;
      } catch (acceptError) {
        const message =
          acceptError instanceof Error ? acceptError.message : 'Could not accept challenge.';
        setError(message);
        throw acceptError;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const declineChallenge = useCallback(
    async (challengeId: string) => {
      setActionLoading(true);
      setError(null);

      try {
        await declineSoloChallenge(challengeId);
        await refresh();
        notifyMatchRefresh();
      } catch (declineError) {
        const message =
          declineError instanceof Error ? declineError.message : 'Could not decline challenge.';
        setError(message);
        throw declineError;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const cancelChallenge = useCallback(
    async (challengeId: string) => {
      setActionLoading(true);
      setError(null);

      try {
        await cancelSoloChallenge(challengeId);
        await refresh();
        notifyMatchRefresh();
      } catch (cancelError) {
        const message =
          cancelError instanceof Error ? cancelError.message : 'Could not cancel challenge.';
        setError(message);
        throw cancelError;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  return {
    status,
    loading,
    actionLoading,
    error,
    refresh,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    hasSentChallenge: status.sent != null,
    hasIncomingChallenge: status.received.length > 0,
  };
}
