import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../theme';
import { RankUpDrawer } from './RankUpDrawer';

const VICTORY_DELAY_MS = 2000;
const VICTORY_FADE_MS = 300;
const DRAWER_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ClimbRanksVisualProps = {
  onReady?: () => void;
};

export function ClimbRanksVisual({ onReady }: ClimbRanksVisualProps) {
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const victoryOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await delay(VICTORY_DELAY_MS);
      if (cancelled) return;
      setVictoryVisible(true);
      await new Promise<void>((resolve) => {
        Animated.timing(victoryOpacity, {
          toValue: 1,
          duration: VICTORY_FADE_MS,
          useNativeDriver: true,
        }).start(() => resolve());
      });
      if (cancelled) return;

      await delay(DRAWER_DELAY_MS);
      if (cancelled) return;
      setDrawerVisible(true);
    }

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {victoryVisible ? (
        <Animated.View style={[styles.victoryBadge, { opacity: victoryOpacity }]}>
          <Text style={styles.victoryLabel}>Victory</Text>
        </Animated.View>
      ) : (
        <View style={styles.victoryPlaceholder} />
      )}

      <RankUpDrawer onContinue={() => onReady?.()} visible={drawerVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  victoryBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(215, 255, 47, 0.1)',
  },
  victoryPlaceholder: {
    height: 40,
  },
  victoryLabel: {
    color: colors.accentLime,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
