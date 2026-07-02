import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { SoloMatchResultDrawer } from '../components/match/solo/SoloMatchResultDrawer';
import { markSoloMatchResultSeen } from '../storage/soloMatchResultStorage';
import type { SoloMatchCompletion } from '../types/soloMatchCompletion';

type SoloMatchCompletionContextValue = {
  showSoloMatchCompletion: (completion: SoloMatchCompletion) => void;
};

const SoloMatchCompletionContext = createContext<SoloMatchCompletionContextValue | null>(null);

export function SoloMatchCompletionProvider({ children }: { children: ReactNode }) {
  const [currentCompletion, setCurrentCompletion] = useState<SoloMatchCompletion | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<SoloMatchCompletion[]>([]);
  const presentedRef = useRef(new Set<string>());

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      setCurrentCompletion(null);
      setVisible(false);
      return;
    }

    setCurrentCompletion(next);
    setVisible(true);
  }, []);

  const showSoloMatchCompletion = useCallback(
    (completion: SoloMatchCompletion) => {
      if (presentedRef.current.has(completion.matchId)) {
        return;
      }

      presentedRef.current.add(completion.matchId);

      if (visible || currentCompletion) {
        queueRef.current.push(completion);
        return;
      }

      setCurrentCompletion(completion);
      setVisible(true);
    },
    [currentCompletion, visible],
  );

  const closeCompletion = useCallback(() => {
    if (currentCompletion) {
      void markSoloMatchResultSeen(currentCompletion.matchId);
    }

    setVisible(false);
    setCurrentCompletion(null);
    showNext();
  }, [currentCompletion, showNext]);

  const value = useMemo(
    () => ({
      showSoloMatchCompletion,
    }),
    [showSoloMatchCompletion],
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
