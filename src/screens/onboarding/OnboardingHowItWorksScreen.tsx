import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HowItWorksFeatureCard,
  OnboardingPrimaryButton,
  OnboardingScreenHeader,
} from '../../components/onboarding';
import { useAuth, useOnboarding } from '../../context';
import { colors, spacing } from '../../theme';

const FEATURES = [
  {
    icon: 'match' as const,
    title: 'ENTER A MATCH',
    description: 'Jump into a 1v1 challenge against another runner.',
    variant: 'accent' as const,
  },
  {
    icon: 'run' as const,
    title: 'RUN',
    description: 'Run anywhere at your own pace and track your performance.',
    variant: 'accent' as const,
  },
  {
    icon: 'levelUp' as const,
    title: 'LEVEL UP',
    description: 'Win matches, earn XP, and climb the ranks.',
    variant: 'accent' as const,
  },
  {
    icon: 'teams' as const,
    title: 'GO BIGGER WITH TEAMS',
    description: 'Join or create a team and compete together against other squads.',
    variant: 'muted' as const,
  },
];

export function OnboardingHowItWorksScreen() {
  const { completeOnboarding, goToStep } = useOnboarding();
  const { session } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingScreenHeader
        onBack={() => goToStep(session ? 'email' : 'login')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>How It Works</Text>
          <Text style={styles.subheadline}>Run Off turns every run into competition.</Text>
        </View>

        <View style={styles.cards}>
          {FEATURES.map((feature) => (
            <HowItWorksFeatureCard
              key={feature.title}
              description={feature.description}
              icon={feature.icon}
              title={feature.title}
              variant={feature.variant}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingPrimaryButton
          label="GET STARTED"
          onPress={() => {
            void completeOnboarding({ showChallengeDrawer: true });
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  subheadline: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
  cards: {
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
