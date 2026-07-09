import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_RESULT, TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { RankBorderAvatar } from '../../team/RankBorderAvatar';
import { ConfettiBurst } from '../../xp/ConfettiBurst';
import { XpLevelUpBanner } from '../../xp/XpLevelUpBanner';
import { RankLeaderboardClimb, RankLeaderboardClimbLayout } from './RankLeaderboardClimb';

const VICTORY_DELAY_MS = 2000;
const VICTORY_FADE_MS = 300;
const CELEBRATION_DELAY_MS = 400;
const POWER_TICK_MS = 900;
const BORDER_CROSSFADE_MS = 600;
const HOLD_BEFORE_LEADERBOARD_MS = 900;
const CROSSFADE_MS = 450;
const CLIMB_DELAY_MS = 350;
const CLIMB_MS = 1400;
const AVATAR_SIZE = 96;
// Reserves the banner's rendered footprint up front so it doesn't shift
// layout when it mounts (XpLevelUpBanner returns null while !visible).
const BANNER_SLOT_HEIGHT = 56;
// Fixed footprint for the "stage" so crossfading celebration <-> leaderboard never shifts layout.
const STAGE_HEIGHT = Math.max(
  AVATAR_SIZE + spacing.lg * 2 + 120,
  RankLeaderboardClimbLayout.ROW_HEIGHT * RankLeaderboardClimbLayout.ROW_COUNT + spacing.lg,
);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateTo(value: Animated.Value, toValue: number, duration: number, useNativeDriver = true): Promise<void> {
  return new Promise((resolve) => {
    Animated.timing(value, { toValue, duration, useNativeDriver }).start(() => resolve());
  });
}

function tweenValue(from: number, to: number, duration: number, onUpdate: (value: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const value = new Animated.Value(from);
    const listenerId = value.addListener(({ value: current }) => onUpdate(current));

    Animated.timing(value, { toValue: to, duration, useNativeDriver: false }).start(() => {
      value.removeListener(listenerId);
      resolve();
    });
  });
}

type ClimbRanksVisualProps = {
  onReady?: () => void;
};

export function ClimbRanksVisual({ onReady }: ClimbRanksVisualProps) {
  const [powerRating, setPowerRating] = useState(TUTORIAL_RESULT.previousPower);
  const [confettiActive, setConfettiActive] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const victoryOpacity = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const borderCrossfade = useRef(new Animated.Value(0)).current; // 0 = silver, 1 = gold
  const leaderboardOpacity = useRef(new Animated.Value(0)).current;
  const climbProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await delay(VICTORY_DELAY_MS);
      if (cancelled) return;
      await animateTo(victoryOpacity, 1, VICTORY_FADE_MS);
      if (cancelled) return;

      await delay(CELEBRATION_DELAY_MS);
      if (cancelled) return;
      await animateTo(celebrationOpacity, 1, 260);
      if (cancelled) return;

      // Power rating ticks up first...
      await tweenValue(TUTORIAL_RESULT.previousPower, TUTORIAL_RESULT.newPower, POWER_TICK_MS, (value) =>
        setPowerRating(Math.round(value)),
      );
      if (cancelled) return;

      await delay(150);
      if (cancelled) return;

      // ...then confetti falls and the rank-up reveal plays.
      setConfettiActive(true);
      setBannerVisible(true);
      await animateTo(borderCrossfade, 1, BORDER_CROSSFADE_MS, false);
      if (cancelled) return;

      await delay(HOLD_BEFORE_LEADERBOARD_MS);
      if (cancelled) return;

      // Crossfade from the celebration into the leaderboard climb.
      await Promise.all([
        animateTo(celebrationOpacity, 0, CROSSFADE_MS),
        animateTo(leaderboardOpacity, 1, CROSSFADE_MS),
      ]);
      if (cancelled) return;

      await delay(CLIMB_DELAY_MS);
      if (cancelled) return;
      await animateTo(climbProgress, 1, CLIMB_MS, false);
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

      <View style={styles.stage}>
        <Animated.View style={[styles.stageLayer, styles.celebration, { opacity: celebrationOpacity }]}>
          <ConfettiBurst active={confettiActive} />

          <View style={styles.avatarWrap}>
            <Animated.View style={[styles.avatarLayer, { opacity: silverOpacity }]}>
              <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="silver" size={AVATAR_SIZE} />
            </Animated.View>
            <Animated.View style={[styles.avatarLayer, { opacity: borderCrossfade }]}>
              <RankBorderAvatar avatarUrl={TUTORIAL_USER.avatarUrl} rankTierId="gold" size={AVATAR_SIZE} />
            </Animated.View>
          </View>

          <View style={styles.powerSection}>
            <Text style={styles.sectionLabel}>Power Rating</Text>
            <Text style={styles.powerValue}>{powerRating.toLocaleString('en-US')}</Text>
          </View>

          <View style={styles.bannerSlot}>
            {bannerVisible ? <XpLevelUpBanner level={0} subtitle="" title="Rank Up!" visible /> : null}
          </View>
        </Animated.View>

        <Animated.View style={[styles.stageLayer, styles.leaderboardLayer, { opacity: leaderboardOpacity }]}>
          <Text style={styles.sectionLabel}>Leaderboard</Text>
          <RankLeaderboardClimb progress={climbProgress} />
        </Animated.View>
      </View>
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
  stage: {
    width: '100%',
    height: STAGE_HEIGHT,
  },
  stageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  celebration: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
  },
  leaderboardLayer: {
    width: '100%',
    gap: spacing.sm,
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
  powerSection: {
    alignItems: 'center',
    gap: 2,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  powerValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  bannerSlot: {
    width: '100%',
    height: BANNER_SLOT_HEIGHT,
    alignItems: 'center',
  },
});
