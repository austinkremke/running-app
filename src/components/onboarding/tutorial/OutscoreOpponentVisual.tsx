import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { SoloMatchScoreboard } from '../../match/solo';
import { TUTORIAL_OPPONENT, TUTORIAL_SCORING, TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import type { ActiveSoloMatch } from '../../../mock';
import { AnimatedStreetRouteMap, BLOCK_DIRECTIONS, buildBlockRoute } from './AnimatedStreetRouteMap';

const GREEN_ROUTE = buildBlockRoute(
  { lat: 32.7845, lng: -96.802 },
  [
    [BLOCK_DIRECTIONS.ne, 3],
    [BLOCK_DIRECTIONS.nw, 2],
    [BLOCK_DIRECTIONS.sw, 3],
    [BLOCK_DIRECTIONS.se, 2],
  ],
);

// Shorter than the user's route — fewer blocks, same grid.
const PURPLE_ROUTE = buildBlockRoute(
  { lat: 32.783, lng: -96.7955 },
  [
    [BLOCK_DIRECTIONS.nw, 2],
    [BLOCK_DIRECTIONS.sw, 1],
    [BLOCK_DIRECTIONS.se, 2],
    [BLOCK_DIRECTIONS.ne, 1],
  ],
);

const ROUTE_DRAW_MS = 3000;
const SCORE_TICK_MS = 600;
const END_IN_MS = 3 * 24 * 60 * 60 * 1000;

function tween(from: number, to: number, duration: number, onUpdate: (value: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const value = new Animated.Value(from);
    const listenerId = value.addListener(({ value: current }) => onUpdate(current));

    Animated.timing(value, { toValue: to, duration, useNativeDriver: false }).start(() => {
      value.removeListener(listenerId);
      resolve();
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildInitialMatch(): ActiveSoloMatch {
  const endsAt = new Date(Date.now() + END_IN_MS).toISOString();

  return {
    id: 'tutorial-match',
    endsAt,
    homeRunner: {
      id: 'tutorial-user',
      name: TUTORIAL_USER.name,
      level: 15,
      avatarUrl: TUTORIAL_USER.avatarUrl,
      totalPoints: 0,
      accent: 'lime',
      rankTierId: TUTORIAL_USER.rankTierId,
    },
    awayRunner: {
      id: 'tutorial-opponent',
      name: TUTORIAL_OPPONENT.name,
      level: 14,
      avatarUrl: TUTORIAL_OPPONENT.avatarUrl,
      totalPoints: 0,
      accent: 'purple',
      rankTierId: TUTORIAL_OPPONENT.rankTierId,
    },
    countdown: { days: 3, hours: 0, minutes: 0, seconds: 0 },
    info: {
      rank: 0,
      rankPercentile: '',
      matchType: '3 Day Run Off',
      matchTypeIcon: 'footsteps',
      entryFee: 0,
      entryFeeLabel: '',
    },
    stats: [],
    activities: [],
    highlights: [],
  };
}

type OutscoreOpponentVisualProps = {
  onReady?: () => void;
};

export function OutscoreOpponentVisual({ onReady }: OutscoreOpponentVisualProps) {
  const [mapVisible, setMapVisible] = useState(false);
  const [greenReveal, setGreenReveal] = useState(0);
  const [purpleReveal, setPurpleReveal] = useState(0);
  const [match, setMatch] = useState<ActiveSoloMatch>(buildInitialMatch);
  const mapOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    function updateScore(side: 'home' | 'away', points: number) {
      if (cancelled) return;
      setMatch((previous) => ({
        ...previous,
        homeRunner:
          side === 'home' ? { ...previous.homeRunner, totalPoints: Math.round(points) } : previous.homeRunner,
        awayRunner:
          side === 'away' ? { ...previous.awayRunner, totalPoints: Math.round(points) } : previous.awayRunner,
      }));
    }

    async function run() {
      await delay(1000);
      if (cancelled) return;
      setMapVisible(true);
      Animated.timing(mapOpacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      await delay(320);
      if (cancelled) return;

      // Green route draws in first, then its score ticks up.
      await tween(0, GREEN_ROUTE.length - 1, ROUTE_DRAW_MS, (value) => setGreenReveal(Math.round(value)));
      if (cancelled) return;
      await tween(0, TUTORIAL_SCORING.user.score, SCORE_TICK_MS, (value) => updateScore('home', value));
      if (cancelled) return;

      await delay(250);

      // Purple route draws in after, over a shorter block loop, then its score ticks up.
      await tween(0, PURPLE_ROUTE.length - 1, ROUTE_DRAW_MS, (value) => setPurpleReveal(Math.round(value)));
      if (cancelled) return;
      await tween(0, TUTORIAL_SCORING.opponent.score, SCORE_TICK_MS, (value) => updateScore('away', value));
      if (cancelled) return;

      onReady?.();
    }

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {mapVisible ? (
        <Animated.View style={{ opacity: mapOpacity }}>
          <AnimatedStreetRouteMap
            greenRevealCount={greenReveal}
            greenRoute={GREEN_ROUTE}
            purpleRevealCount={purpleReveal}
            purpleRoute={PURPLE_ROUTE}
          />
        </Animated.View>
      ) : (
        <View style={styles.mapPlaceholder} />
      )}

      <SoloMatchScoreboard match={match} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  mapPlaceholder: {
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
