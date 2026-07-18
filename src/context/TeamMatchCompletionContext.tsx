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

import { TeamMatchResultDrawer } from '../components/match/team';
import { useUserId } from './AuthContext';
import { ackMatchCompletion } from '../services/matchmakingService';
import { runTeamMatchCompletionFlow } from '../services/teamMatchCompletionFlow';
import { subscribeTeamMatchCompletionSync } from '../services/teamMatchCompletionBus';
import { markTeamMatchResultSeen } from '../storage/teamMatchResultStorage';
import type { TeamMatchCompletion } from '../types/teamMatchCompletion';

const SYNC_INTERVAL_MS = 3_000;

type TeamMatchCompletionContextValue = {
  syncCompletions: () => Promise<TeamMatchCompletion[]>;
};

const TeamMatchCompletionContext = createContext<TeamMatchCompletionContextValue | null>(null);

function isQueued(
  completion: TeamMatchCompletion,
  current: TeamMatchCompletion | null,
  queue: TeamMatchCompletion[],
) {
  if (current?.matchId === completion.matchId) {
    return true;
  }

  return queue.some((item) => item.matchId === completion.matchId);
}

export function TeamMatchCompletionProvider({ children }: { children: ReactNode }) {
  const userId = useUserId();
  const [currentCompletion, setCurrentCompletion] = useState<TeamMatchCompletion | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<TeamMatchCompletion[]>([]);
  const visibleRef = useRef(false);
  const currentRef = useRef<TeamMatchCompletion | null>(null);
  const showRef = useRef<(completion: TeamMatchCompletion) => void>(() => {});

  const openCompletion = useCallback((completion: TeamMatchCompletion) => {
    visibleRef.current = true;
    currentRef.current = completion;
    setCurrentCompletion(completion);
    setVisible(true);
  }, []);

  const showTeamMatchCompletion = useCallback(
    (completion: TeamMatchCompletion) => {
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

  showRef.current = showTeamMatchCompletion;

  const closeCompletion = useCallback(async () => {
    const completion = currentRef.current;

    visibleRef.current = false;
    currentRef.current = null;
    setVisible(false);
    setCurrentCompletion(null);

    if (completion) {
      await markTeamMatchResultSeen(completion.matchId);
      ackMatchCompletion(completion.matchId).catch((error) => {
        console.warn('Could not ack team match completion', error);
      });
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
      return await runTeamMatchCompletionFlow(userId, (completion) => showRef.current(completion));
    } catch (error) {
      console.warn('Could not sync team match completions', error);
      return [];
    }
  }, [userId]);

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

    const unsubscribeSync = subscribeTeamMatchCompletionSync(() => {
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
    <TeamMatchCompletionContext.Provider value={value}>
      {children}
      <TeamMatchResultDrawer completion={currentCompletion} onClose={closeCompletion} visible={visible} />
    </TeamMatchCompletionContext.Provider>
  );
}

export function useTeamMatchCompletion() {
  const context = useContext(TeamMatchCompletionContext);
  if (!context) {
    throw new Error('useTeamMatchCompletion must be used within TeamMatchCompletionProvider');
  }

  return context;
}
