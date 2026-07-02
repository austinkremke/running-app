import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { SoloMatchResultDrawer } from '../components/match/solo/SoloMatchResultDrawer';
import { useAuth, useUserId } from './AuthContext';
import { runSoloMatchCompletionFlow } from '../services/soloMatchCompletionFlow';
import { subscribeSoloMatchCompletionSync } from '../services/soloMatchCompletionBus';
import { markSoloMatchResultSeen } from '../storage/soloMatchResultStorage';
import type { SoloMatchCompletion } from '../types/soloMatchCompletion';

const SYNC_INTERVAL_MS = 3_000;

type SoloMatchCompletionContextValue = {
  syncCompletions: () => Promise<SoloMatchCompletion[]>;
};

const SoloMatchCompletionContext = createContext<SoloMatchCompletionContextValue | null>(null);

function isQueued(
  completion: SoloMatchCompletion,
  current: SoloMatchCompletion | null,
  queue: SoloMatchCompletion[],
) {
  if (current?.matchId === completion.matchId) {
    return true;
  }

  return queue.some((item) => item.matchId === completion.matchId);
}

export function SoloMatchCompletionProvider({ children }: { children: ReactNode }) {
  const userId = useUserId();
  const { refreshGameState } = useAuth();
  const [currentCompletion, setCurrentCompletion] = useState<SoloMatchCompletion | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<SoloMatchCompletion[]>([]);
  const visibleRef = useRef(false);
  const currentRef = useRef<SoloMatchCompletion | null>(null);
  const showRef = useRef<(completion: SoloMatchCompletion) => void>(() => {});

  const openCompletion = useCallback((completion: SoloMatchCompletion) => {
    visibleRef.current = true;
    currentRef.current = completion;
    setCurrentCompletion(completion);
    setVisible(true);

    if (__DEV__) {
      console.log('[SoloMatchCompletion] presenting result drawer', completion.matchId, completion.outcome);
    }
  }, []);

  const showSoloMatchCompletion = useCallback(
    (completion: SoloMatchCompletion) => {
      if (isQueued(completion, currentRef.current, queueRef.current)) {
        return;
      }

      if (visibleRef.current) {
        queueRef.current.push(completion);
        return;
      }

      openCompletion(completion);
    },
    [openCompletion],
  );

  showRef.current = showSoloMatchCompletion;

  const closeCompletion = useCallback(async () => {
    const completion = currentRef.current;

    visibleRef.current = false;
    currentRef.current = null;
    setVisible(false);
    setCurrentCompletion(null);

    if (completion) {
      await markSoloMatchResultSeen(completion.matchId);
    }

    const next = queueRef.current.shift();
    if (next) {
      openCompletion(next);
    }
  }, [openCompletion]);

  const syncCompletions = useCallback(async () => {
    if (!userId) {
      return [];
    }

    try {
      return await runSoloMatchCompletionFlow(
        userId,
        (completion) => showRef.current(completion),
        refreshGameState,
      );
    } catch (error) {
      console.warn('Could not sync solo match completions', error);
      return [];
    }
  }, [refreshGameState, userId]);

  useEffect(() => {
    if (!userId) {
      queueRef.current = [];
      visibleRef.current = false;
      currentRef.current = null;
      setVisible(false);
      setCurrentCompletion(null);
      return;
    }

    void syncCompletions();

    const interval = setInterval(() => {
      void syncCompletions();
    }, SYNC_INTERVAL_MS);

    const appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        void syncCompletions();
      }
    });

    const unsubscribeSync = subscribeSoloMatchCompletionSync(() => {
      void syncCompletions();
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
      unsubscribeSync();
    };
  }, [syncCompletions, userId]);

  const value = useMemo(
    () => ({
      syncCompletions,
    }),
    [syncCompletions],
  );

  return (
    <SoloMatchCompletionContext.Provider value={value}>
      {children}
      <SoloMatchResultDrawer completion={currentCompletion} onClose={closeCompletion} visible={visible} />
    </SoloMatchCompletionContext.Provider>
  );
}

export function useSoloMatchCompletion() {
  const context = useContext(SoloMatchCompletionContext);
  if (!context) {
    throw new Error('useSoloMatchCompletion must be used within SoloMatchCompletionProvider');
  }

  return context;
}
