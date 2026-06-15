import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingAuthButton, RunOffLogo } from '../../components/onboarding';
import { useOnboarding } from '../../context';
import { colors, spacing } from '../../theme';

export function OnboardingLoginScreen() {
  const { mockSignIn } = useOnboarding();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <RunOffLogo />

          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>RUN.{'\n'}COMPETE.</Text>
            <Text style={styles.headlineAccent}>CLIMB THE RANKS.</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <OnboardingAuthButton
            icon="logo-apple"
            label="CONTINUE WITH APPLE"
            onPress={() => mockSignIn('apple')}
          />
          <OnboardingAuthButton
            icon="logo-google"
            label="CONTINUE WITH GOOGLE"
            onPress={() => mockSignIn('google')}
          />
          <OnboardingAuthButton
            icon="mail-outline"
            label="CONTINUE WITH EMAIL"
            onPress={() => mockSignIn('email')}
            variant="primary"
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => mockSignIn('email')}
            style={({ pressed }) => [styles.existingAccount, pressed && styles.pressed]}
          >
            <Text style={styles.existingAccountText}>I ALREADY HAVE AN ACCOUNT</Text>
            <Text style={styles.existingAccountChevron}>›</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  headlineBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: 0.5,
  },
  headlineAccent: {
    color: colors.accentLime,
    fontSize: 34,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  actions: {
    gap: spacing.sm,
  },
  existingAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  existingAccountText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  existingAccountChevron: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1,
  },
  pressed: {
    opacity: 0.75,
  },
});
