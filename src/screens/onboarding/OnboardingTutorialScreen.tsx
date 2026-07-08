import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ClimbRanksVisual,
  FindMatchVisual,
  OnboardingCTA,
  OnboardingProgressIndicator,
  OnboardingStepContainer,
  OutscoreOpponentVisual,
  TeamLeaderboardDemo,
} from '../../components/onboarding/tutorial';
import { OnboardingPrimaryButton } from '../../components/onboarding';
import { colors, spacing } from '../../theme';

type TutorialStep = {
  key: string;
  headline: string;
  supportingCopy: string;
  // Step visuals have differing prop shapes (most take none, one takes onReady) —
  // typed loosely here since each usage below passes only the props that component accepts.
  Visual: ComponentType<{ onReady?: () => void }>;
  /** True when the step animates its own readiness (Next stays disabled until it calls onReady). */
  requiresReady?: boolean;
};

const STEPS: TutorialStep[] = [
  {
    key: 'hook',
    headline: 'Find a Match',
    supportingCopy: 'We’ll find another runner of a similar skill level.',
    Visual: FindMatchVisual,
  },
  {
    key: 'scoring',
    headline: 'Outscore Your Opponent',
    supportingCopy: 'Run farther, keep your pace up, and build your score before the time expires.',
    Visual: OutscoreOpponentVisual,
    requiresReady: true,
  },
  {
    key: 'ranking',
    headline: 'Climb the Ranks',
    supportingCopy: 'Wins increase your power rankings and move you towards the next tier.',
    Visual: ClimbRanksVisual,
    requiresReady: true,
  },
  {
    key: 'teams',
    headline: 'Run with a squad',
    supportingCopy: 'Join a team, contribute points, and compete on the leaderboard.',
    Visual: TeamLeaderboardDemo,
  },
];

const FADE_DURATION_MS = 220;

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
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [stepReady, setStepReady] = useState(false);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const isFinalStep = stepIndex >= STEPS.length;

  useEffect(() => {
    if (!isFinalStep) {
      setStepReady(!STEPS[stepIndex].requiresReady);
    }
  }, [stepIndex, isFinalStep]);

  function advance() {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start(() => {
      setStepIndex((previous) => Math.min(previous + 1, STEPS.length));
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    });
  }

  if (isFinalStep) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View style={[styles.fadeWrap, { opacity: screenOpacity }]}>
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
        </Animated.View>
      </View>
    );
  }

  const step = STEPS[stepIndex];
  const Visual = step.Visual;

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarHeader}>
          <Text style={styles.topBarTitle}>How It Works</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        </View>
        <OnboardingProgressIndicator activeIndex={stepIndex} stepCount={STEPS.length + 1} />
      </View>

      <Animated.View style={[styles.fadeWrap, { opacity: screenOpacity }]}>
        <OnboardingStepContainer
          footer={
            <OnboardingPrimaryButton
              label="Next"
              onPress={stepReady ? advance : undefined}
            />
          }
          headline={step.headline}
          stepKey={step.key}
          supportingCopy={step.supportingCopy}
        >
          <Visual key={step.key} onReady={() => setStepReady(true)} />
        </OnboardingStepContainer>
      </Animated.View>

      {previewMode ? (
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeLabel}>PREVIEW</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  topBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
  fadeWrap: {
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
