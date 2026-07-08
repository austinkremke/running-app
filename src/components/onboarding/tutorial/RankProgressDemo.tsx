import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TUTORIAL_RESULT, TUTORIAL_USER } from '../../../config/onboardingTutorialData';
import { colors, spacing } from '../../../theme';
import { RANK_TIER_COLORS } from '../../team/rankAvatarBorderTheme';
import { AnimatedXpProgressBar } from '../../xp/AnimatedXpProgressBar';
import { AnimatedCounter } from './AnimatedCounter';

const RANK_COLOR = RANK_TIER_COLORS.gold;

export function RankProgressDemo() {
  const victoryScale = useRef(new Animated.Value(0.85)).current;
  const victoryOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const rankPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(victoryOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(victoryScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 16,
          bounciness: 10,
        }),
      ]),
      Animated.timing(progress, { toValue: TUTORIAL_RESULT.rankProgress, duration: 700, useNativeDriver: false }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rankPulse, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(rankPulse, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]),
        { iterations: 2 },
      ).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rankGlow = rankPulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.victoryBadge, { opacity: victoryOpacity, transform: [{ scale: victoryScale }] }]}
      >
        <Text style={styles.victoryLabel}>Victory</Text>
      </Animated.View>

      <View style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreName}>You</Text>
          <Text style={[styles.scoreValue, styles.scoreValueWin]}>{TUTORIAL_RESULT.userScore}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreRow}>
          <Text style={styles.scoreName}>Opponent</Text>
          <Text style={styles.scoreValue}>{TUTORIAL_RESULT.opponentScore}</Text>
        </View>
      </View>

      <View style={styles.powerRow}>
        <View style={styles.powerChip}>
          <Text style={styles.powerChipLabel}>+{TUTORIAL_RESULT.powerGain} Power</Text>
        </View>
        <AnimatedCounter
          delay={200}
          duration={900}
          from={TUTORIAL_RESULT.previousPower}
          style={styles.powerValue}
          to={TUTORIAL_RESULT.newPower}
        />
      </View>

      <View style={styles.rankSection}>
        <Animated.View
          style={[
            styles.rankChip,
            { borderColor: RANK_COLOR, shadowColor: RANK_COLOR, shadowOpacity: rankGlow },
          ]}
        >
          <Text style={[styles.rankChipLabel, { color: RANK_COLOR }]}>{TUTORIAL_USER.rank}</Text>
        </Animated.View>
        <AnimatedXpProgressBar height={10} progress={progress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
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
  victoryLabel: {
    color: colors.accentLime,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scoreCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreName: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  scoreValue: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  scoreValueWin: {
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  powerChip: {
    backgroundColor: 'rgba(215, 255, 47, 0.1)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  powerChipLabel: {
    color: colors.accentLime,
    fontSize: 11,
    fontWeight: '800',
  },
  powerValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  rankSection: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  rankChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  rankChipLabel: {
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
