import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { SoloMatchScoreboard, SoloMatchStatsSection } from '../../match/solo';
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
const TICK_MS = 500;
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
    stats: [
      { id: 'distance', label: 'Distance', icon: 'footsteps-outline', homeValue: '0.0 mi', awayValue: '0.0 mi', homeProgress: 0.5 },
      { id: 'pace', label: 'Pace', icon: 'speedometer-outline', homeValue: '--', awayValue: '--', homeProgress: 0.5 },
    ],
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
  const homeMilesRef = useRef(0);
  const awayMilesRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    function updateDistanceStat(side: 'home' | 'away', miles: number) {
      if (cancelled) return;
      if (side === 'home') {
        homeMilesRef.current = miles;
      } else {
        awayMilesRef.current = miles;
      }

      const total = Math.max(homeMilesRef.current + awayMilesRef.current, 0.01);

      setMatch((previous) => ({
        ...previous,
        stats: previous.stats.map((stat) =>
          stat.id === 'distance'
            ? {
                ...stat,
                homeValue: `${homeMilesRef.current.toFixed(1)} mi`,
                awayValue: `${awayMilesRef.current.toFixed(1)} mi`,
                homeProgress: homeMilesRef.current / total,
              }
            : stat,
        ),
      }));
    }

    function updatePaceStat(side: 'home' | 'away', label: string) {
      if (cancelled) return;
      setMatch((previous) => ({
        ...previous,
        stats: previous.stats.map((stat) =>
          stat.id === 'pace'
            ? { ...stat, [side === 'home' ? 'homeValue' : 'awayValue']: label }
            : stat,
        ),
      }));
    }

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

      // Green route draws in first.
      await tween(0, GREEN_ROUTE.length - 1, ROUTE_DRAW_MS, (value) => setGreenReveal(Math.round(value)));
      if (cancelled) return;

      await tween(0, TUTORIAL_SCORING.user.distanceMiles, TICK_MS, (value) => updateDistanceStat('home', value));
      if (cancelled) return;
      updatePaceStat('home', `${TUTORIAL_SCORING.user.pace}/mi`);
      await delay(TICK_MS);
      if (cancelled) return;
      await tween(0, TUTORIAL_SCORING.user.score, TICK_MS, (value) => updateScore('home', value));
      if (cancelled) return;

      await delay(250);

      // Purple route draws in after, over a shorter block loop.
      await tween(0, PURPLE_ROUTE.length - 1, ROUTE_DRAW_MS, (value) => setPurpleReveal(Math.round(value)));
      if (cancelled) return;

      await tween(0, TUTORIAL_SCORING.opponent.distanceMiles, TICK_MS, (value) => updateDistanceStat('away', value));
      if (cancelled) return;
      updatePaceStat('away', `${TUTORIAL_SCORING.opponent.pace}/mi`);
      await delay(TICK_MS);
      if (cancelled) return;
      await tween(0, TUTORIAL_SCORING.opponent.score, TICK_MS, (value) => updateScore('away', value));
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

      <View style={styles.matchHeader}>
        <SoloMatchScoreboard match={match} />
        <SoloMatchStatsSection match={match} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  mapPlaceholder: {
    height: 240,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  matchHeader: {
    gap: spacing.sm,
  },
});
