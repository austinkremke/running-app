import { useCallback, useEffect, useState } from 'react';

import type { Team } from '../mock';
import { fetchMyTeam } from '../services/teamService';
import { useUserId } from '../context';

export function useMyTeam() {
  const userId = useUserId();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setTeam(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextTeam = await fetchMyTeam(userId);
      setTeam(nextTeam);
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load your team.';
      setError(message);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { team, loading, error, refresh };
}
