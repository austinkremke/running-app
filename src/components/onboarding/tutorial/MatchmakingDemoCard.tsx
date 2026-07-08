import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import {
  TUTORIAL_MATCH_TIMER,
  TUTORIAL_OPPONENT,
  TUTORIAL_OPPONENT_CANDIDATES,
  TUTORIAL_USER,
} from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { MatchVsIndicator } from '../../match/MatchVsIndicator';

const CYCLE_INTERVAL_MS = 160;
const CYCLE_COUNT = 5;

export function MatchmakingDemoCard() {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const lockScale = useRef(new Animated.Value(0.9)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let count = 0;

    const interval = setInterval(() => {
      count += 1;
      if (cancelled) return;

      Animated.sequence([
        Animated.timing(cardOpacity, { toValue: 0.2, duration: 70, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 70, useNativeDriver: true }),
      ]).start();

      setCycleIndex((previous) => (previous + 1) % TUTORIAL_OPPONENT_CANDIDATES.length);

      if (count >= CYCLE_COUNT) {
        clearInterval(interval);
        setMatchFound(true);
        Animated.spring(lockScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 10,
        }).start();
        Animated.timing(revealOpacity, {
          toValue: 1,
          duration: 320,
          delay: 220,
          useNativeDriver: true,
        }).start();
      }
    }, CYCLE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={[styles.statusDot, matchFound && styles.statusDotFound]} />
        <Text style={styles.statusLabel}>{matchFound ? 'Match Found' : 'Finding opponent…'}</Text>
      </View>
      <Text style={styles.skillLabel}>Skill Match</Text>

      <Animated.View
        style={[
          styles.card,
          { opacity: cardOpacity, transform: [{ scale: matchFound ? lockScale : 1 }] },
        ]}
      >
        <View style={styles.playerRow}>
          <View style={styles.playerBlock}>
            <Text style={styles.playerName}>{TUTORIAL_USER.name}</Text>
            <Text style={styles.playerMeta}>
              {TUTORIAL_USER.rank} · {TUTORIAL_USER.power.toLocaleString()} PWR
            </Text>
          </View>

          <MatchVsIndicator variant="diamond" />

          <View style={[styles.playerBlock, styles.playerBlockRight]}>
            <Text style={styles.playerName}>
              {matchFound ? TUTORIAL_OPPONENT.name : TUTORIAL_OPPONENT_CANDIDATES[cycleIndex]}
            </Text>
            <Text style={styles.playerMeta}>
              {matchFound
                ? `${TUTORIAL_OPPONENT.rank} · ${TUTORIAL_OPPONENT.power.toLocaleString()} PWR`
                : 'Searching…'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.headToHead, { opacity: revealOpacity }]}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreValue}>0</Text>
          <Text style={styles.scoreDivider}>–</Text>
          <Text style={styles.scoreValue}>0</Text>
        </View>
        <View style={styles.timerChip}>
          <Text style={styles.timerLabel}>{TUTORIAL_MATCH_TIMER}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentPurple,
  },
  statusDotFound: {
    backgroundColor: colors.accentLime,
  },
  statusLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  skillLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  playerBlock: {
    flex: 1,
    gap: 2,
  },
  playerBlockRight: {
    alignItems: 'flex-end',
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  playerMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  headToHead: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreValue: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  scoreDivider: {
    color: colors.textSecondary,
    fontSize: 24,
    fontWeight: '700',
  },
  timerChip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  timerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
