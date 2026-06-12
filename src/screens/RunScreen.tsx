import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RunBottomDrawer, RunMapArea } from '../components/run';
import { XpGainDrawer, XpGainTestButtons } from '../components/xp';
import { MOCK_XP_GAIN_LEVEL_UP, MOCK_XP_GAIN_NORMAL } from '../mock';
import type { XpGainEvent } from '../mock';
import { colors } from '../theme';

type RunScreenProps = {
  onBack?: () => void;
};

export function RunScreen({ onBack }: RunScreenProps) {
  const [xpDrawerVisible, setXpDrawerVisible] = useState(false);
  const [xpEvent, setXpEvent] = useState<XpGainEvent | null>(null);

  function openXpDrawer(event: XpGainEvent) {
    setXpEvent(event);
    setXpDrawerVisible(true);
  }

  function closeXpDrawer() {
    setXpDrawerVisible(false);
    setXpEvent(null);
  }

  return (
    <View style={styles.container}>
      <RunMapArea onBack={onBack} />
      <RunBottomDrawer
        footer={
          <XpGainTestButtons
            onTestLevelUp={() => openXpDrawer(MOCK_XP_GAIN_LEVEL_UP)}
            onTestNormal={() => openXpDrawer(MOCK_XP_GAIN_NORMAL)}
          />
        }
      />
      <XpGainDrawer event={xpEvent} onClose={closeXpDrawer} visible={xpDrawerVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
