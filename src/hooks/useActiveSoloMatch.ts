import { useCallback, useEffect, useState } from 'react';

import type { ActiveSoloMatch } from '../mock';
import { useAuth, useUserId } from '../context';
import {
  fallbackSoloMatch,
  fetchActiveSoloMatch,
} from '../services/matchService';
import { runAchievementEvaluation } from '../services/achievementTriggers';

export function useActiveSoloMatch() {
  const userId = useUserId();
  const { refreshGameState } = useAuth();
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
        await runAchievementEvaluation({ refreshGameState });
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
  }, [refreshGameState, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { match, loading, error, fromServer, refresh };
}
