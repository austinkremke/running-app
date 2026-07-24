import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { PendingSyncedActivity } from '../services/healthKitSyncService';
import { recordsToGpsPoints } from '../services/activityAdapters';
import { computeDistanceMilestoneSplits } from '../services/activityStreams';
import { recordDistanceSplits } from '../services/distanceRecords';
import { createFeedPost } from '../services/feedService';
import { isHealthKitAvailable, requestHealthKitReadAccess } from '../services/healthKitService';
import { syncHealthKitWorkouts } from '../services/healthKitSyncService';
import { uploadRunPhoto } from '../services/runPhotoUpload';
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
  // True from the moment a run is locked in until its XP drawer is actually
  // dismissed — the Lock-In screen for the *next* queued activity must not
  // appear until then, or it would stack on top of/race the drawer.
  const [awaitingXpClose, setAwaitingXpClose] = useState(false);

  const pushPendingActivities = useCallback((activities: PendingSyncedActivity[]) => {
    if (activities.length === 0) return;
    setQueue((current) => [...current, ...activities]);
  }, []);

  // Auto-sync once per session on app open, so the user isn't required to
  // manually trigger this from Settings — any new HealthKit workouts pop the
  // same "Lock in your run" confirmation a manual sync would queue.
  const userId = session?.user?.id ?? gameState?.profile.id ?? null;
  const autoSyncedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || autoSyncedUserIdRef.current === userId) return;
    autoSyncedUserIdRef.current = userId;

    if (!isHealthKitAvailable()) return;

    (async () => {
      const granted = await requestHealthKitReadAccess().catch(() => false);
      if (!granted) return;

      const result = await syncHealthKitWorkouts(userId).catch(() => null);
      if (result) pushPendingActivities(result.syncedActivities);
    })();
  }, [userId, pushPendingActivities]);

  const current = queue[0] ?? null;
  const lockInVisible = current != null && !awaitingXpClose;

  function dequeue() {
    setQueue((prev) => prev.slice(1));
    setAwaitingXpClose(false);
  }

  async function handleAddToFeed(title: string, photoUri?: string) {
    if (!current) return;
    const userId = session?.user?.id ?? gameState?.profile.id;

    if (!userId) {
      Alert.alert('Feed post failed', 'Sign in to post to the feed.');
      return;
    }

    let photoUrl: string | undefined;
    if (photoUri) {
      try {
        photoUrl = await uploadRunPhoto(userId, current.session.id, photoUri);
      } catch (error) {
        Alert.alert('Photo upload failed', getErrorMessage(error, 'Could not upload photo.'));
        return;
      }
    }

    try {
      await createFeedPost({
        userId,
        activityId: current.session.id,
        title,
        description: `Synced from ${current.sourceName}`,
        createdAt: current.session.endedAt,
        photoUrl,
      });
    } catch (error) {
      Alert.alert('Feed post failed', getErrorMessage(error, 'Could not post to feed.'));
      return;
    }

    try {
      const splits = computeDistanceMilestoneSplits(current.records);
      if (splits.length > 0) {
        await recordDistanceSplits(current.session.id, splits);
      }
    } catch (error) {
      console.warn('[PendingActivityConfirmation] Could not record distance milestone splits', error);
    }

    // Hide this Lock-In screen now; the XP drawer takes over next. The next
    // queued activity's Lock-In screen only appears once dequeue() runs, and
    // that only happens once presentRunAward's onClose fires — i.e. once the
    // user has actually seen and dismissed this run's drawer (or there was
    // nothing to show, in which case it fires immediately).
    setAwaitingXpClose(true);
    try {
      await presentRunAward(() => awardRunXp(current), dequeue);
    } catch (error) {
      Alert.alert('XP award failed', getErrorMessage(error, 'Could not award XP for this run.'));
      dequeue();
    }
  }

  const value = useMemo(() => ({ pushPendingActivities }), [pushPendingActivities]);

  return (
    <PendingActivityConfirmationContext.Provider value={value}>
      {children}
      {current ? (
        <Modal animationType="slide" presentationStyle="fullScreen" visible={lockInVisible}>
          <SafeAreaProvider>
            <PostRunScreen
              key={current.session.id}
              onAddToFeed={(title, photoUri) => void handleAddToFeed(title, photoUri)}
              onBack={dequeue}
              routePoints={recordsToGpsPoints(current.records)}
              sourceName={current.sourceName}
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
