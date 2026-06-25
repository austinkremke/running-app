import { useCallback, useEffect, useState } from 'react';

import type { ActiveTeamMatch } from '../mock';
import { useUserId } from '../context';
import {
  fallbackTeamMatch,
  fetchActiveTeamMatch,
} from '../services/matchService';

export function useActiveTeamMatch() {
  const userId = useUserId();
  const [match, setMatch] = useState<ActiveTeamMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromServer, setFromServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setMatch(fallbackTeamMatch());
      setFromServer(false);
      setLoading(false);
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { match, loading, error, fromServer, refresh };
}
