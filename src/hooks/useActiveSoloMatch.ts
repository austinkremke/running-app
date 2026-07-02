import { useCallback, useEffect, useRef, useState } from 'react';

import type { ActiveSoloMatch } from '../mock';
import { useAuth, useSoloMatchCompletion, useUserId } from '../context';
import type { SoloMatchCompletion } from '../types/soloMatchCompletion';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useMatchRealtimeRefresh } from '../hooks/useMatchRealtimeRefresh';
import { fetchActiveSoloMatch } from '../services/matchService';
import { finalizeDueSoloMatches, fetchStoredSoloMatchCompletions } from '../services/matchmakingService';
import { subscribeMatchRefresh } from '../services/matchRefreshBus';
import {
  hasSeenSoloMatchResult,
} from '../storage/soloMatchResultStorage';

type RefreshOptions = {
  silent?: boolean;
};

async function collectUnseenCompletions(
  userId: string,
  freshCompletions: Awaited<ReturnType<typeof finalizeDueSoloMatches>>,
  showSoloMatchCompletion: (completion: SoloMatchCompletion) => void,
  refreshGameState: () => Promise<void>,
) {
  const storedCompletions = await fetchStoredSoloMatchCompletions(userId);
  const byMatchId = new Map<string, SoloMatchCompletion>();

  for (const completion of [...freshCompletions, ...storedCompletions]) {
    byMatchId.set(completion.matchId, completion);
  }

  const unseen: SoloMatchCompletion[] = [];

  for (const completion of byMatchId.values()) {
    const seen = await hasSeenSoloMatchResult(completion.matchId);
    if (seen) {
      continue;
    }

    unseen.push(completion);
  }

  if (unseen.length === 0) {
    return;
  }

  await refreshGameState();

  for (const completion of unseen) {
    showSoloMatchCompletion(completion);
  }
}

export function useActiveSoloMatch() {
  const userId = useUserId();
  const { refreshGameState } = useAuth();
  const { showSoloMatchCompletion } = useSoloMatchCompletion();
  const { runEvaluation } = useAchievementUnlockPresentation();
  const [match, setMatch] = useState<ActiveSoloMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromServer, setFromServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const completions = await finalizeDueSoloMatches();
        await collectUnseenCompletions(userId, completions, showSoloMatchCompletion, refreshGameState);

        const serverMatch = await fetchActiveSoloMatch(userId, { skipFinalize: true });
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
    [refreshGameState, runEvaluation, showSoloMatchCompletion, userId],
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
      void refresh({ silent: true });
      return;
    }

    expiryTimeoutRef.current = setTimeout(() => {
      void refresh({ silent: true });
    }, remainingMs + 1000);

    return () => {
      if (expiryTimeoutRef.current) {
        clearTimeout(expiryTimeoutRef.current);
        expiryTimeoutRef.current = null;
      }
    };
  }, [match?.endsAt, match?.id, refresh]);

  return { match, loading, error, fromServer, refresh };
}
