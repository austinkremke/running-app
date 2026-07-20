import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { PendingSyncedActivity } from '../services/healthKitSyncService';
import { recordsToGpsPoints } from '../services/activityAdapters';
import { createFeedPost } from '../services/feedService';
import { PostRunScreen } from '../screens/PostRunScreen';
import { getErrorMessage } from '../utils/errors';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { useAuth } from './AuthContext';
import { usePlayerProgress } from './PlayerProgressContext';

type PendingActivityConfirmationContextValue = {
  /** Queues one or more synced activities to confirm via "Lock in your run", shown one at a time. */
  pushPendingActivities: (activities: PendingSyncedActivity[]) => void;
};

const PendingActivityConfirmationContext =
  createContext<PendingActivityConfirmationContextValue | null>(null);

export function PendingActivityConfirmationProvider({ children }: { children: ReactNode }) {
  const { session, gameState } = useAuth();
  const { awardRunXp } = usePlayerProgress();
  const { presentRunAward } = useAchievementUnlockPresentation();
  const [queue, setQueue] = useState<PendingSyncedActivity[]>([]);

  const pushPendingActivities = useCallback((activities: PendingSyncedActivity[]) => {
    if (activities.length === 0) return;
    setQueue((current) => [...current, ...activities]);
  }, []);

  const current = queue[0] ?? null;

  function dequeue() {
    setQueue((prev) => prev.slice(1));
  }

  async function handleAddToFeed(title: string) {
    if (!current) return;
    const userId = session?.user?.id ?? gameState?.profile.id;

    if (!userId) {
      Alert.alert('Feed post failed', 'Sign in to post to the feed.');
      return;
    }

    try {
      await createFeedPost({
        userId,
        activityId: current.session.id,
        title,
        description: `Synced from ${current.sourceName}`,
        createdAt: current.session.endedAt,
      });
    } catch (error) {
      Alert.alert('Feed post failed', getErrorMessage(error, 'Could not post to feed.'));
      return;
    }

    try {
      await presentRunAward(() => awardRunXp(current));
    } catch (error) {
      Alert.alert('XP award failed', getErrorMessage(error, 'Could not award XP for this run.'));
    }

    dequeue();
  }

  const value = useMemo(() => ({ pushPendingActivities }), [pushPendingActivities]);

  return (
    <PendingActivityConfirmationContext.Provider value={value}>
      {children}
      {current ? (
        <Modal animationType="slide" presentationStyle="fullScreen" visible>
          <SafeAreaProvider>
            <PostRunScreen
              onAddToFeed={(title) => void handleAddToFeed(title)}
              onBack={dequeue}
              routePoints={recordsToGpsPoints(current.records)}
              summary={current.summary}
            />
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </PendingActivityConfirmationContext.Provider>
  );
}

export function usePendingActivityConfirmation() {
  const context = useContext(PendingActivityConfirmationContext);
  if (!context) {
    throw new Error(
      'usePendingActivityConfirmation must be used within PendingActivityConfirmationProvider',
    );
  }
  return context;
}
