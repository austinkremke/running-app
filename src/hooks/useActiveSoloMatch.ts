import { useCallback, useEffect, useState } from 'react';

import type { ActiveSoloMatch } from '../mock';
import { useUserId } from '../context';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useMatchRealtimeRefresh } from '../hooks/useMatchRealtimeRefresh';
import {
  fetchActiveSoloMatch,
} from '../services/matchService';
import { subscribeMatchRefresh } from '../services/matchRefreshBus';

type RefreshOptions = {
  silent?: boolean;
};

export function useActiveSoloMatch() {
  const userId = useUserId();
  const { runEvaluation } = useAchievementUnlockPresentation();
  const [match, setMatch] = useState<ActiveSoloMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromServer, setFromServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const serverMatch = await fetchActiveSoloMatch(userId);
        if (serverMatch) {
          setMatch(serverMatch);
          setFromServer(true);
          await runEvaluation();
        } else {
          setMatch(null);
          setFromServer(false);
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
    [runEvaluation, userId],
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

  return { match, loading, error, fromServer, refresh };
}
