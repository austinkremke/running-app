import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RunBottomDrawer, RunMapArea } from '../components/run';
// import { PostRunTestButton } from '../components/post-run';
// import { XpGainTestButtons } from '../components/xp';
import { useAuth, usePlayerProgress, useRun } from '../context';
import {
  MOCK_POST_RUN,
  MOCK_POST_RUN_ROUTE,
} from '../mock';
import type { FeedTab } from '../mock';
import { useAchievementUnlockPresentation } from '../hooks/useAchievementUnlockPresentation';
import { recordsToGpsPoints } from '../services/activityAdapters';
import { publishActivityToFeed } from '../services/feedService';
import { makeMockRunActivity } from '../services/progression/mockRunActivity';
import { getErrorMessage } from '../utils/errors';
import { PostRunScreen } from './PostRunScreen';
import { colors } from '../theme';

type RunScreenProps = {
  onBack?: () => void;
};

export function RunScreen({ onBack }: RunScreenProps) {
  const { gameState, session } = useAuth();
  const { awardRunXp } = usePlayerProgress();
  const { presentRunAward } = useAchievementUnlockPresentation();
  const {
    isRecording,
    routePoints,
    distanceLabel,
    durationLabel,
    paceLabel,
    lastFinishedRun,
    startRun,
    stopRun,
    clearLastFinishedRun,
  } = useRun();
  const [postRunVisible, setPostRunVisible] = useState(false);
  const [previewPostRun, setPreviewPostRun] = useState(false);

  useEffect(() => {
    if (!lastFinishedRun) return;
    setPostRunVisible(true);
  }, [lastFinishedRun]);

  function openMockPostRun() {
    setPreviewPostRun(true);
    setPostRunVisible(true);
  }

  function closePostRun() {
    setPostRunVisible(false);
    setPreviewPostRun(false);
    clearLastFinishedRun();
  }

  async function handleDevOneMileXp() {
    const userId = session?.user?.id ?? gameState?.profile.id;
    if (!userId) {
      Alert.alert('Dev XP preview', 'Sign in to preview XP awards.');
      return;
    }

    const activity = makeMockRunActivity({
      distanceMiles: 1,
      paceSecondsPerMile: 9 * 60,
      sessionId: `dev-one-mile-${Date.now()}`,
    });

    try {
      await presentRunAward(() => awardRunXp(activity));
    } catch (error) {
      Alert.alert('Dev XP preview failed', getErrorMessage(error, 'Could not preview XP.'));
    }
  }

  async function handleAddToFeed() {
    const finishedRun = lastFinishedRun;
    const activityId = finishedRun?.session.id;
    const userId = session?.user?.id ?? gameState?.profile.id;

    if (!activityId || !finishedRun) {
      Alert.alert('Feed post failed', 'No finished run to post.');
      return;
    }

    if (!userId) {
      Alert.alert('Feed post failed', 'Sign in to post to the feed.');
      return;
    }

    const audiences: FeedTab[] = ['community', 'friends'];
    if (gameState?.profile.team_id) {
      audiences.push('team');
    }

    try {
      await publishActivityToFeed({
        userId,
        activityId,
        title: 'What a great run!',
        audiences,
      });
    } catch (error) {
      Alert.alert('Feed post failed', getErrorMessage(error, 'Could not post to feed.'));
      return;
    }

    try {
      await presentRunAward(() => awardRunXp(finishedRun));
    } catch (error) {
      Alert.alert('XP award failed', getErrorMessage(error, 'Could not award XP for this run.'));
      closePostRun();
      return;
    }

    closePostRun();
  }

  async function handleStartRun() {
    const started = await startRun();
    if (!started) {
      Alert.alert(
        'Location required',
        'Enable location access in Settings to record your run.',
      );
    }
  }

  async function handleStopRun() {
    await stopRun();
  }

  function handleBack() {
    if (!isRecording) {
      onBack?.();
      return;
    }

    Alert.alert('Stop your run?', 'Going back will end your current run.', [
      { text: 'Keep running', style: 'cancel' },
      {
        text: 'Stop run',
        style: 'destructive',
        onPress: () => {
          void stopRun();
        },
      },
    ]);
  }

  const postRunSummary = previewPostRun ? MOCK_POST_RUN : lastFinishedRun?.summary;
  const postRunRoute = previewPostRun
    ? MOCK_POST_RUN_ROUTE
    : lastFinishedRun
      ? recordsToGpsPoints(lastFinishedRun.records)
      : [];

  return (
    <View style={styles.container}>
      <RunMapArea isTracking={isRecording} onBack={handleBack} routePoints={routePoints} />
      <RunBottomDrawer
        distanceLabel={distanceLabel}
        durationLabel={durationLabel}
        isRecording={isRecording}
        onStartRun={handleStartRun}
        onStopRun={handleStopRun}
        paceLabel={paceLabel}
        footer={
          // __DEV__ ? (
          //   <>
          //     <PostRunTestButton onPress={openMockPostRun} />
          //     <XpGainTestButtons
          //       onTestLevelUp={() => openXpDrawer(MOCK_XP_GAIN_LEVEL_UP)}
          //       onTestNormal={() => openXpDrawer(MOCK_XP_GAIN_NORMAL)}
          //       onTestOneMile={() => {
          //         void handleDevOneMileXp();
          //       }}
          //     />
          //   </>
          // ) : null
          null
        }
      />
      {postRunSummary ? (
        <Modal animationType="slide" presentationStyle="fullScreen" visible={postRunVisible}>
          <SafeAreaProvider>
            <PostRunScreen
              onAddToFeed={handleAddToFeed}
              onBack={closePostRun}
              routePoints={postRunRoute}
              summary={postRunSummary}
            />
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
