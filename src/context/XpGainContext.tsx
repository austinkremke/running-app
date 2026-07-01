import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { XpGainDrawer } from '../components/xp';
import type { UnlockedAchievementPayload } from '../services/achievementService';
import { buildAchievementXpGainEvent } from '../services/progression/buildAchievementXpGainEvent';
import type { XpGainEvent } from '../types/progression';

type XpGainContextValue = {
  showXpGain: (event: XpGainEvent) => void;
  showAchievementUnlocks: (
    beforeTotalXp: number,
    unlocks: UnlockedAchievementPayload[],
  ) => void;
};

const XpGainContext = createContext<XpGainContextValue | null>(null);

export function XpGainProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<XpGainEvent | null>(null);
  const queueRef = useRef<XpGainEvent[]>([]);
  const isShowingRef = useRef(false);

  const showXpGain = useCallback((event: XpGainEvent) => {
    if (event.breakdown.length === 0 && event.xpEarned <= 0) {
      return;
    }

    if (isShowingRef.current) {
      queueRef.current.push(event);
      return;
    }

    isShowingRef.current = true;
    setCurrentEvent(event);
    setVisible(true);
  }, []);

  const showAchievementUnlocks = useCallback(
    (beforeTotalXp: number, unlocks: UnlockedAchievementPayload[]) => {
      if (unlocks.length === 0) {
        return;
      }

      showXpGain(buildAchievementXpGainEvent(beforeTotalXp, unlocks));
    },
    [showXpGain],
  );

  const closeXpGain = useCallback(() => {
    setVisible(false);
    setCurrentEvent(null);

    setTimeout(() => {
      const next = queueRef.current.shift();
      if (next) {
        setCurrentEvent(next);
        setVisible(true);
        return;
      }

      isShowingRef.current = false;
    }, 280);
  }, []);

  const value = useMemo(
    () => ({
      showXpGain,
      showAchievementUnlocks,
    }),
    [showAchievementUnlocks, showXpGain],
  );

  return (
    <XpGainContext.Provider value={value}>
      {children}
      <XpGainDrawer event={currentEvent} onClose={closeXpGain} visible={visible} />
    </XpGainContext.Provider>
  );
}

export function useXpGain() {
  const context = useContext(XpGainContext);
  if (!context) {
    throw new Error('useXpGain must be used within XpGainProvider');
  }
  return context;
}

export type { XpGainEvent };
