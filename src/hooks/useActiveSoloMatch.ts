import { useCallback, useEffect, useRef, useState } from 'react';

import type { ActiveSoloMatch } from '../mock';
import { useAuth, useUserId } from '../context';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useMatchRealtimeRefresh } from '../hooks/useMatchRealtimeRefresh';
import { fetchActiveSoloMatch } from '../services/matchService';
import { notifySoloMatchCompletionSync } from '../services/soloMatchCompletionBus';
import { subscribeMatchRefresh } from '../services/matchRefreshBus';

type RefreshOptions = {
  silent?: boolean;
};

const PAST_DUE_POLL_MS = 2_000;

export function useActiveSoloMatch() {
  const userId = useUserId();
  const { refreshGameState } = useAuth();
  const { runEvaluation } = useAchievementUnlockPresentation();
  const [match, setMatch] = useState<ActiveSoloMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromServer, setFromServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pastDuePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hadActiveMatchRef = useRef(false);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!userId) {
        setMatch(null);
        setFromServer(false);
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const serverMatch = await fetchActiveSoloMatch(userId, { skipFinalize: true });
        if (serverMatch) {
          setMatch(serverMatch);
          setFromServer(true);
          hadActiveMatchRef.current = true;
          await runEvaluation();
        } else {
          if (hadActiveMatchRef.current) {
            notifySoloMatchCompletionSync();
            hadActiveMatchRef.current = false;
          }
          setMatch(null);
          setFromServer(false);
          void refreshGameState();
        }
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : 'Could not load solo match.';
        setError(message);
        setMatch(null);
        setFromServer(false);
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [refreshGameState, runEvaluation, userId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeMatchRefresh(() => {
      void refresh({ silent: true });
    });
  }, [refresh]);

  useMatchRealtimeRefresh(match?.id ?? null, () => {
    void refresh({ silent: true });
  }, fromServer);

  useEffect(() => {
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }

    if (!match?.endsAt) {
      return;
    }

    const remainingMs = new Date(match.endsAt).getTime() - Date.now();
    if (remainingMs <= 0) {
      notifySoloMatchCompletionSync();
      void refresh({ silent: true });
      return;
    }

    expiryTimeoutRef.current = setTimeout(() => {
      notifySoloMatchCompletionSync();
      void refresh({ silent: true });
    }, remainingMs + 1000);

    return () => {
      if (expiryTimeoutRef.current) {
        clearTimeout(expiryTimeoutRef.current);
        expiryTimeoutRef.current = null;
      }
    };
  }, [match?.endsAt, match?.id, refresh]);

  useEffect(() => {
    if (pastDuePollRef.current) {
      clearInterval(pastDuePollRef.current);
      pastDuePollRef.current = null;
    }

    if (!match?.endsAt) {
      return;
    }

    const isPastDue = new Date(match.endsAt).getTime() <= Date.now();
    if (!isPastDue) {
      return;
    }

    pastDuePollRef.current = setInterval(() => {
      notifySoloMatchCompletionSync();
      void refresh({ silent: true });
    }, PAST_DUE_POLL_MS);

    return () => {
      if (pastDuePollRef.current) {
        clearInterval(pastDuePollRef.current);
        pastDuePollRef.current = null;
      }
    };
  }, [match?.endsAt, match?.id, refresh]);

  return { match, loading, error, fromServer, refresh };
}
