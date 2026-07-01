import { useCallback, useEffect, useState } from 'react';

import type { ActiveSoloMatch } from '../mock';
import { useUserId } from '../context';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import {
  fetchActiveSoloMatch,
} from '../services/matchService';

export function useActiveSoloMatch() {
  const userId = useUserId();
  const { runEvaluation } = useAchievementUnlockPresentation();
  const [match, setMatch] = useState<ActiveSoloMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromServer, setFromServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setMatch(null);
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
      setLoading(false);
    }
  }, [runEvaluation, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { match, loading, error, fromServer, refresh };
}
