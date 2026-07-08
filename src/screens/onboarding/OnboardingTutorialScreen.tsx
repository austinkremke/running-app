import { useRef, useState, type ComponentType } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FindMatchVisual,
  HeadToHeadScoreDemo,
  MatchmakingDemoCard,
  OnboardingCTA,
  OnboardingProgressIndicator,
  OnboardingStepContainer,
  RankProgressDemo,
  TeamLeaderboardDemo,
} from '../../components/onboarding/tutorial';
import { OnboardingPrimaryButton } from '../../components/onboarding';
import { colors, spacing } from '../../theme';

type TutorialStep = {
  key: string;
  headline: string;
  supportingCopy: string;
  Visual: ComponentType;
};

const STEPS: TutorialStep[] = [
  {
    key: 'hook',
    headline: 'Find a Match',
    supportingCopy: 'We’ll find another runner of a similar skill level.',
    Visual: FindMatchVisual,
  },
  {
    key: 'matchmaking',
    headline: 'Get matched by skill',
    supportingCopy: 'Enter a Run Off and face a runner near your power ranking.',
    Visual: MatchmakingDemoCard,
  },
  {
    key: 'scoring',
    headline: 'Outscore your opponent',
    supportingCopy: 'Run farther, keep your pace up, and build your score before time expires.',
    Visual: HeadToHeadScoreDemo,
  },
  {
    key: 'ranking',
    headline: 'Climb the ranks',
    supportingCopy: 'Wins increase your power ranking and move you toward the next tier.',
    Visual: RankProgressDemo,
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
  const [stepIndex, setStepIndex] = useState(0);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const isFinalStep = stepIndex >= STEPS.length;

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
      <SafeAreaView style={styles.safe}>
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
      </SafeAreaView>
    );
  }

  const step = STEPS[stepIndex];
  const Visual = step.Visual;

  return (
    <SafeAreaView style={styles.safe}>
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
          footer={<OnboardingPrimaryButton label="Next" onPress={advance} />}
          headline={step.headline}
          stepKey={step.key}
          supportingCopy={step.supportingCopy}
        >
          <Visual />
        </OnboardingStepContainer>
      </Animated.View>

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
