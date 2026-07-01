import { useCallback, useEffect, useRef, useState } from 'react';

import {
  cancelSoloMatchmaking,
  enqueueSoloMatchmaking,
  getSoloMatchmakingStatus,
  type SoloMatchmakingStatus,
} from '../services/matchmakingService';
import { useUserId } from '../context';

const POLL_INTERVAL_MS = 3000;

export function useSoloMatchmaking() {
  const userId = useUserId();
  const [status, setStatus] = useState<SoloMatchmakingStatus>({ status: 'idle' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setStatus({ status: 'idle' });
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const nextStatus = await getSoloMatchmakingStatus();
      setStatus(nextStatus);
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load matchmaking status.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (status.status !== 'waiting' || !userId) {
      return;
    }

    pollRef.current = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [refresh, status.status, userId]);

  const findMatch = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const nextStatus = await enqueueSoloMatchmaking();
      setStatus(nextStatus);
    } catch (findError) {
      const message =
        findError instanceof Error ? findError.message : 'Could not join matchmaking.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  }, [userId]);

  const cancelSearch = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await cancelSoloMatchmaking();
      setStatus({ status: 'idle' });
    } catch (cancelError) {
      const message =
        cancelError instanceof Error ? cancelError.message : 'Could not cancel matchmaking.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  }, [userId]);

  return {
    status,
    loading,
    actionLoading,
    error,
    refresh,
    findMatch,
    cancelSearch,
    isSearching: status.status === 'waiting',
    hasActiveMatch: status.status === 'in_match' || status.status === 'matched',
  };
}
