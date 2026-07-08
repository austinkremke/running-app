import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_SCORING } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { AnimatedCounter } from './AnimatedCounter';
import { AnimatedRoutePreview } from './AnimatedRoutePreview';

const USER_ROUTE = 'M10,110 C 70,40 120,100 170,50 S 260,20 300,10';
const OPPONENT_ROUTE = 'M10,120 C 80,90 140,120 190,90 S 250,60 300,40';
const OPPONENT_DELAY_MS = 500;
const MILESTONE_INTERVAL_MS = 900;

export function HeadToHeadScoreDemo() {
  const [milestoneIndex, setMilestoneIndex] = useState(-1);
  const milestoneOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers = TUTORIAL_SCORING.milestones.map((_, index) =>
      setTimeout(() => {
        setMilestoneIndex(index);
        Animated.sequence([
          Animated.timing(milestoneOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.delay(500),
          Animated.timing(milestoneOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start();
      }, index * MILESTONE_INTERVAL_MS + 300),
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapPanel}>
        <View style={StyleSheet.absoluteFill}>
          <AnimatedRoutePreview color={colors.accentLime} duration={1000} path={USER_ROUTE} />
        </View>
        <View style={StyleSheet.absoluteFill}>
          <AnimatedRoutePreview
            color={colors.accentPurple}
            delay={OPPONENT_DELAY_MS}
            duration={900}
            path={OPPONENT_ROUTE}
          />
        </View>

        {milestoneIndex >= 0 ? (
          <Animated.View style={[styles.milestoneChip, { opacity: milestoneOpacity }]}>
            <Text style={styles.milestoneText}>{TUTORIAL_SCORING.milestones[milestoneIndex]}</Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCard}>
          <View style={[styles.dot, { backgroundColor: colors.accentLime }]} />
          <Text style={styles.playerLabel}>You</Text>
          <AnimatedCounter
            duration={1200}
            from={0}
            style={styles.scoreValue}
            suffix=" pts"
            to={TUTORIAL_SCORING.user.score}
          />
          <View style={styles.chipRow}>
            <Text style={styles.chip}>{TUTORIAL_SCORING.user.distanceMiles} mi</Text>
            <Text style={styles.chip}>{TUTORIAL_SCORING.user.pace}/mi</Text>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <View style={[styles.dot, { backgroundColor: colors.accentPurple }]} />
          <Text style={styles.playerLabel}>Opponent</Text>
          <AnimatedCounter
            delay={OPPONENT_DELAY_MS}
            duration={1000}
            from={0}
            style={styles.scoreValue}
            suffix=" pts"
            to={TUTORIAL_SCORING.opponent.score}
          />
          <View style={styles.chipRow}>
            <Text style={styles.chip}>{TUTORIAL_SCORING.opponent.distanceMiles} mi</Text>
            <Text style={styles.chip}>{TUTORIAL_SCORING.opponent.pace}/mi</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  mapPanel: {
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  milestoneChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accentLime,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  milestoneText: {
    color: colors.accentLime,
    fontSize: 10,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scoreValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
