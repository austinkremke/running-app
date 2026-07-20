import { useCallback, useEffect, useState } from 'react';

import type { ActiveSoloMatch } from '../mock';
import { fetchSoloMatchById } from '../services/matchService';

export function useSoloMatchById(matchId: string | null) {
  const [match, setMatch] = useState<ActiveSoloMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!matchId) {
      setMatch(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchSoloMatchById(matchId);
      setMatch(result);
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load match.';
      setError(message);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { match, loading, error, refresh };
}
