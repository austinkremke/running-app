import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HeadToHeadScoreDemo,
  MatchmakingDemoCard,
  MatchupHookVisual,
  OnboardingCTA,
  OnboardingProgressIndicator,
  OnboardingStepContainer,
  RankProgressDemo,
  TeamLeaderboardDemo,
} from '../../components/onboarding/tutorial';
import { colors, spacing } from '../../theme';

type TutorialStep = {
  key: string;
  headline: string;
  supportingCopy: string;
  autoAdvanceMs: number | null;
  Visual: ComponentType;
};

const STEPS: TutorialStep[] = [
  {
    key: 'hook',
    headline: 'Welcome to Run Off',
    supportingCopy: 'Every run is a matchup.',
    autoAdvanceMs: 4200,
    Visual: MatchupHookVisual,
  },
  {
    key: 'matchmaking',
    headline: 'Get matched by skill',
    supportingCopy: 'Enter a Run Off and face a runner near your power ranking.',
    autoAdvanceMs: 3600,
    Visual: MatchmakingDemoCard,
  },
  {
    key: 'scoring',
    headline: 'Outscore your opponent',
    supportingCopy: 'Run farther, keep your pace up, and build your score before time expires.',
    autoAdvanceMs: 4200,
    Visual: HeadToHeadScoreDemo,
  },
  {
    key: 'ranking',
    headline: 'Climb the ranks',
    supportingCopy: 'Wins increase your power ranking and move you toward the next tier.',
    autoAdvanceMs: 3600,
    Visual: RankProgressDemo,
  },
  {
    key: 'teams',
    headline: 'Run with a squad',
    supportingCopy: 'Join a team, contribute points, and compete on the leaderboard.',
    autoAdvanceMs: 3400,
    Visual: TeamLeaderboardDemo,
  },
];

type OnboardingTutorialScreenProps = {
  /** Preview mode (opened from the Me page) never marks onboarding complete. */
  previewMode?: boolean;
  onFindFirstMatch: () => void;
  onMaybeLater: () => void;
  onSkip: () => void;
};

export function OnboardingTutorialScreen({
  previewMode = false,
  onFindFirstMatch,
  onMaybeLater,
  onSkip,
}: OnboardingTutorialScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFinalStep = stepIndex >= STEPS.length;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isFinalStep) return;

    const current = STEPS[stepIndex];
    if (current.autoAdvanceMs == null) return;

    timerRef.current = setTimeout(() => {
      setStepIndex((previous) => Math.min(previous + 1, STEPS.length));
    }, current.autoAdvanceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepIndex, isFinalStep]);

  function advance() {
    setStepIndex((previous) => Math.min(previous + 1, STEPS.length));
  }

  if (isFinalStep) {
    return (
      <SafeAreaView style={styles.safe}>
        <OnboardingStepContainer
          footer={
            <OnboardingCTA
              onPrimaryPress={onFindFirstMatch}
              onSecondaryPress={onMaybeLater}
              primaryLabel="Find My First Match"
              secondaryLabel="Maybe Later"
            />
          }
          headline="Ready to run?"
          stepKey="cta"
          supportingCopy="Find your first match and start climbing."
        >
          <View style={styles.ctaVisual}>
            <View style={styles.ctaGlow} />
          </View>
        </OnboardingStepContainer>
      </SafeAreaView>
    );
  }

  const step = STEPS[stepIndex];
  const Visual = step.Visual;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <OnboardingProgressIndicator activeIndex={stepIndex} stepCount={STEPS.length + 1} />
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
      </View>

      <Pressable onPress={advance} style={styles.tapArea}>
        <OnboardingStepContainer
          headline={step.headline}
          stepKey={step.key}
          supportingCopy={step.supportingCopy}
        >
          <Visual />
        </OnboardingStepContainer>
      </Pressable>

      {previewMode ? (
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeLabel}>PREVIEW</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  skipLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tapArea: {
    flex: 1,
  },
  ctaVisual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaGlow: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(215, 255, 47, 0.08)',
    borderWidth: 1,
    borderColor: colors.accentLime,
  },
  previewBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    alignSelf: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewBadgeLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
