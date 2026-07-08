import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { AnimatedXpProgressBar } from '../../xp/AnimatedXpProgressBar';
import { ConfettiBurst } from '../../xp/ConfettiBurst';
import { XpLevelUpBanner } from '../../xp/XpLevelUpBanner';

const VICTORY_DELAY_MS = 2000;
const VICTORY_FADE_MS = 300;
const CELEBRATION_DELAY_MS = 400;
const BAR_FILL_MS = 900;
const BORDER_CROSSFADE_MS = 600;
const RANK_PROGRESS = 0.68;
const AVATAR_SIZE = 96;
// Reserves the banner's rendered footprint up front so it doesn't shift
// layout when it mounts (XpLevelUpBanner returns null while !visible).
const BANNER_SLOT_HEIGHT = 74;

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
  const [celebrationStarted, setCelebrationStarted] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const victoryOpacity = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const borderCrossfade = useRef(new Animated.Value(0)).current; // 0 = silver, 1 = gold

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await delay(VICTORY_DELAY_MS);
      if (cancelled) return;
      await animateTo(victoryOpacity, 1, VICTORY_FADE_MS);
      if (cancelled) return;

      await delay(CELEBRATION_DELAY_MS);
      if (cancelled) return;
      setCelebrationStarted(true);
      await animateTo(celebrationOpacity, 1, 260);
      if (cancelled) return;

      await animateTo(progress, RANK_PROGRESS, BAR_FILL_MS, false);
      if (cancelled) return;

      setBannerVisible(true);
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
      <Animated.View style={[styles.victoryBadge, { opacity: victoryOpacity }]}>
        <Text style={styles.victoryLabel}>Victory</Text>
      </Animated.View>

      <Animated.View style={[styles.celebration, { opacity: celebrationOpacity }]}>
        <ConfettiBurst active={celebrationStarted} />

        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.avatarLayer, { opacity: silverOpacity }]}>
            <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="silver" size={AVATAR_SIZE} />
          </Animated.View>
          <Animated.View style={[styles.avatarLayer, { opacity: borderCrossfade }]}>
            <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="gold" size={AVATAR_SIZE} />
          </Animated.View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.sectionLabel}>Power Rating</Text>
          <AnimatedXpProgressBar height={14} progress={progress} />
        </View>

        <View style={styles.bannerSlot}>
          {bannerVisible ? <XpLevelUpBanner level={0} subtitle="" title="Rank Up!" visible /> : null}
        </View>
      </Animated.View>
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
  victoryLabel: {
    color: colors.accentLime,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  celebration: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
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
  progressSection: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bannerSlot: {
    width: '100%',
    height: BANNER_SLOT_HEIGHT,
    alignItems: 'center',
  },
});
