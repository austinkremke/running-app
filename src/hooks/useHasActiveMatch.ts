import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useUserId } from '../context';
import { fetchHasActiveMatch } from '../services/matchService';
import { subscribeMatchRefresh } from '../services/matchRefreshBus';
import { subscribeSoloMatchCompletionSync } from '../services/soloMatchCompletionBus';

const ACTIVE_MATCH_POLL_MS = 15_000;

export function useHasActiveMatch(): boolean {
  const userId = useUserId();
  const [hasActiveMatch, setHasActiveMatch] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setHasActiveMatch(false);
      return;
    }

    try {
      setHasActiveMatch(await fetchHasActiveMatch(userId));
    } catch (error) {
      console.warn('Failed to check active match status', error);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeMatchRefresh(() => {
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    return subscribeSoloMatchCompletionSync(() => {
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, ACTIVE_MATCH_POLL_MS);

    return () => clearInterval(interval);
  }, [refresh]);

  return hasActiveMatch;
}
