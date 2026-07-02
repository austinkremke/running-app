import { useCallback, useEffect, useState } from 'react';

import type { ActiveTeamMatch } from '../mock';
import { useUserId } from '../context';
import {
  fallbackTeamMatch,
  fetchActiveTeamMatch,
} from '../services/matchService';
import { subscribeMatchRefresh } from '../services/matchRefreshBus';
import { useMatchRealtimeRefresh } from './useMatchRealtimeRefresh';

type RefreshOptions = {
  silent?: boolean;
};

export function useActiveTeamMatch() {
  const userId = useUserId();
  const [match, setMatch] = useState<ActiveTeamMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromServer, setFromServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!userId) {
        setMatch(fallbackTeamMatch());
        setFromServer(false);
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const serverMatch = await fetchActiveTeamMatch(userId);
        if (serverMatch) {
          setMatch(serverMatch);
          setFromServer(true);
        } else {
          setMatch(fallbackTeamMatch());
          setFromServer(false);
        }
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : 'Could not load team match.';
        setError(message);
        setMatch(fallbackTeamMatch());
        setFromServer(false);
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [userId],
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
