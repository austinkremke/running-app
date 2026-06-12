import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PostRunTestButton } from '../components/post-run';
import { RunBottomDrawer, RunMapArea } from '../components/run';
import { XpGainDrawer, XpGainTestButtons } from '../components/xp';
import {
  MOCK_POST_RUN,
  MOCK_POST_RUN_ROUTE,
  MOCK_XP_GAIN_LEVEL_UP,
  MOCK_XP_GAIN_NORMAL,
} from '../mock';
import type { XpGainEvent } from '../mock';
import { PostRunScreen } from './PostRunScreen';
import { colors } from '../theme';

type RunScreenProps = {
  onBack?: () => void;
};

export function RunScreen({ onBack }: RunScreenProps) {
  const [xpDrawerVisible, setXpDrawerVisible] = useState(false);
  const [xpEvent, setXpEvent] = useState<XpGainEvent | null>(null);
  const [postRunVisible, setPostRunVisible] = useState(false);

  function openXpDrawer(event: XpGainEvent) {
    setXpEvent(event);
    setXpDrawerVisible(true);
  }

  function closeXpDrawer() {
    setXpDrawerVisible(false);
    setXpEvent(null);
  }

  function openPostRun() {
    setPostRunVisible(true);
  }

  function closePostRun() {
    setPostRunVisible(false);
  }

  function handleAddToFeed() {
    closePostRun();
    openXpDrawer(MOCK_XP_GAIN_NORMAL);
  }

  return (
    <View style={styles.container}>
      <RunMapArea onBack={onBack} />
      <RunBottomDrawer
        footer={
          <>
            <PostRunTestButton onPress={openPostRun} />
            <XpGainTestButtons
              onTestLevelUp={() => openXpDrawer(MOCK_XP_GAIN_LEVEL_UP)}
              onTestNormal={() => openXpDrawer(MOCK_XP_GAIN_NORMAL)}
            />
          </>
        }
      />
      <XpGainDrawer event={xpEvent} onClose={closeXpDrawer} visible={xpDrawerVisible} />
      <Modal animationType="slide" presentationStyle="fullScreen" visible={postRunVisible}>
        <SafeAreaProvider>
          <PostRunScreen
            onAddToFeed={handleAddToFeed}
            onBack={closePostRun}
            routePoints={MOCK_POST_RUN_ROUTE}
            summary={MOCK_POST_RUN}
          />
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
