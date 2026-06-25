import { useCallback, useEffect, useState } from 'react';

import type { ActiveSoloMatch } from '../mock';
import { useUserId } from '../context';
import {
  fallbackSoloMatch,
  fetchActiveSoloMatch,
} from '../services/matchService';

export function useActiveSoloMatch() {
  const userId = useUserId();
  const [match, setMatch] = useState<ActiveSoloMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromServer, setFromServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setMatch(fallbackSoloMatch());
      setFromServer(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const serverMatch = await fetchActiveSoloMatch(userId);
      if (serverMatch) {
        setMatch(serverMatch);
        setFromServer(true);
      } else {
        setMatch(fallbackSoloMatch());
        setFromServer(false);
      }
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load solo match.';
      setError(message);
      setMatch(fallbackSoloMatch());
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
