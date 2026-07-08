import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { AnimatedXpProgressBar } from '../../xp/AnimatedXpProgressBar';
import { XpLevelUpBanner } from '../../xp/XpLevelUpBanner';

const VICTORY_DELAY_MS = 2000;
const VICTORY_FADE_MS = 300;
const BAR_FILL_MS = 900;
const BORDER_CROSSFADE_MS = 600;
const RANK_PROGRESS = 0.68;
const AVATAR_SIZE = 96;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateTo(value: Animated.Value, toValue: number, duration: number, useNativeDriver = true): Promise<void> {
  return new Promise((resolve) => {
    Animated.timing(value, { toValue, duration, useNativeDriver }).start(() => resolve());
  });
}

type ClimbRanksVisualProps = {
  onReady?: () => void;
};

export function ClimbRanksVisual({ onReady }: ClimbRanksVisualProps) {
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const victoryOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const borderCrossfade = useRef(new Animated.Value(0)).current; // 0 = silver, 1 = gold

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await delay(VICTORY_DELAY_MS);
      if (cancelled) return;
      setVictoryVisible(true);
      await animateTo(victoryOpacity, 1, VICTORY_FADE_MS);
      if (cancelled) return;

      await delay(250);
      if (cancelled) return;
      await animateTo(progress, RANK_PROGRESS, BAR_FILL_MS, false);
      if (cancelled) return;

      setLevelUpVisible(true);
      await animateTo(borderCrossfade, 1, BORDER_CROSSFADE_MS, false);
      if (cancelled) return;

      onReady?.();
    }

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const silverOpacity = borderCrossfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.container}>
      {victoryVisible ? (
        <Animated.View style={[styles.victoryBadge, { opacity: victoryOpacity }]}>
          <Text style={styles.victoryLabel}>Victory</Text>
        </Animated.View>
      ) : (
        <View style={styles.victoryPlaceholder} />
      )}

      <View style={styles.avatarWrap}>
        <Animated.View style={[styles.avatarLayer, { opacity: silverOpacity }]}>
          <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="silver" size={AVATAR_SIZE} />
        </Animated.View>
        <Animated.View style={[styles.avatarLayer, { opacity: borderCrossfade }]}>
          <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="gold" size={AVATAR_SIZE} />
        </Animated.View>
      </View>

      <AnimatedXpProgressBar height={10} progress={progress} />

      {levelUpVisible ? <XpLevelUpBanner level={16} visible /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
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
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
