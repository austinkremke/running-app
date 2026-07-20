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

type QueuedXpGain = { event: XpGainEvent; onClose?: () => void };

type XpGainContextValue = {
  /** `onClose` fires once, exactly when this specific event's drawer is dismissed — use it to sequence work that must wait for the user to actually see this drawer (e.g. advancing a queue of pending runs to confirm). Not called at all if there's nothing to show (empty breakdown, no XP). */
  showXpGain: (event: XpGainEvent, onClose?: () => void) => void;
  showAchievementUnlocks: (
    beforeTotalXp: number,
    unlocks: UnlockedAchievementPayload[],
  ) => void;
};

const XpGainContext = createContext<XpGainContextValue | null>(null);

export function XpGainProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<XpGainEvent | null>(null);
  const queueRef = useRef<QueuedXpGain[]>([]);
  const isShowingRef = useRef(false);
  const currentOnCloseRef = useRef<(() => void) | undefined>(undefined);

  const showXpGain = useCallback((event: XpGainEvent, onClose?: () => void) => {
    if (event.breakdown.length === 0 && event.xpEarned <= 0) {
      onClose?.();
      return;
    }

    if (isShowingRef.current) {
      queueRef.current.push({ event, onClose });
      return;
    }

    isShowingRef.current = true;
    currentOnCloseRef.current = onClose;
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
    const finishedOnClose = currentOnCloseRef.current;
    currentOnCloseRef.current = undefined;
    setVisible(false);
    setCurrentEvent(null);
    finishedOnClose?.();

    setTimeout(() => {
      const next = queueRef.current.shift();
      if (next) {
        currentOnCloseRef.current = next.onClose;
        setCurrentEvent(next.event);
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
