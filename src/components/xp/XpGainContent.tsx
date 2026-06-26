import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { XpGainEvent } from '../../mock';
import { colors, spacing } from '../../theme';
import { AnimatedXpProgressBar } from './AnimatedXpProgressBar';
import { ConfettiBurst } from './ConfettiBurst';
import { XpBreakdownList } from './XpBreakdownList';
import { XpGainSummary } from './XpGainSummary';
import { XpLevelDisplay } from './XpLevelDisplay';
import { XpLevelUpBanner } from './XpLevelUpBanner';
import { useXpGainAnimation } from './useXpGainAnimation';

type XpGainContentProps = {
  event: XpGainEvent;
  visible: boolean;
};

function formatXp(value: number): string {
  return value.toLocaleString('en-US');
}

export function XpGainContent({ event, visible }: XpGainContentProps) {
  const {
    progress,
    earnedOpacity,
    displayLevel,
    displayXp,
    displayEarnedXp,
    xpToNextLevel,
    xpRemaining,
    showConfetti,
    levelPulse,
    showLevelUpBanner,
    phase,
    visibleLineCount,
    activeLineIndex,
    skipToEnd,
  } = useXpGainAnimation(event, visible);

  const segments =
    event.breakdown.length > 0
      ? event.breakdown
      : event.xpEarned > 0
        ? [{ key: 'distance' as const, label: 'Run XP', xp: event.xpEarned }]
        : [];

  return (
    <Pressable
      accessibilityHint="Tap to skip XP animation"
      accessibilityRole="button"
      onPress={skipToEnd}
      style={styles.pressable}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ConfettiBurst active={showConfetti} />

        <XpGainSummary
          earnedOpacity={earnedOpacity}
          runSummary={event.runSummary}
          xpEarned={displayEarnedXp}
        />

        <XpBreakdownList
          activeLineIndex={activeLineIndex}
          segments={segments}
          visibleLineCount={visibleLineCount}
        />

        <View style={styles.card}>
          <XpLevelDisplay level={displayLevel} pulse={levelPulse} />

          <View style={styles.progressSection}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionLabel}>Experience</Text>
              <Text style={styles.xpText}>
                <Text style={styles.xpCurrent}>{formatXp(displayXp)}</Text>
                <Text style={styles.xpTotal}> / {formatXp(xpToNextLevel)} XP</Text>
              </Text>
            </View>

            <AnimatedXpProgressBar progress={progress} height={14} />

            <Text style={styles.remaining}>{formatXp(xpRemaining)} XP to next level</Text>
          </View>

          <XpLevelUpBanner level={displayLevel} visible={showLevelUpBanner} />
        </View>

        {phase !== 'done' && phase !== 'idle' ? (
          <Text style={styles.skipHint}>Tap anywhere to skip</Text>
        ) : null}
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  progressSection: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  xpCurrent: {
    color: colors.accentLime,
  },
  xpTotal: {
    color: colors.textSecondary,
  },
  remaining: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  skipHint: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
