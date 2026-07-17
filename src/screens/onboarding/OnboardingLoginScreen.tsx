import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingAuthButton, OnboardingScreenHeader, RunOffLogo } from '../../components/onboarding';
import { isGoogleAuthConfigured } from '../../config/auth';
import { useAuth, isSupabaseConfigured, useOnboarding } from '../../context';
import { isAppleSignInAvailable } from '../../services/oauthAuth';
import { colors, spacing } from '../../theme';

type ProviderAction = 'apple' | 'google' | null;

export function OnboardingLoginScreen() {
  const { goToStep } = useOnboarding();
  const { signInWithApple, signInWithGoogle, authError, clearAuthError } = useAuth();
  const [activeProvider, setActiveProvider] = useState<ProviderAction>(null);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === 'ios');
  const googleConfigured = isGoogleAuthConfigured;

  useEffect(() => {
    isAppleSignInAvailable()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <RunOffLogo />
          <Text style={styles.hint}>
            Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and
            EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleAppleSignIn() {
    clearAuthError();
    setActiveProvider('apple');
    try {
      await signInWithApple();
      goToStep('howItWorks');
    } catch {
      // Error surfaced via authError in context.
    } finally {
      setActiveProvider(null);
    }
  }

  async function handleGoogleSignIn() {
    clearAuthError();
    setActiveProvider('google');
    try {
      await signInWithGoogle();
      goToStep('howItWorks');
    } catch {
      // Error surfaced via authError in context.
    } finally {
      setActiveProvider(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingScreenHeader onBack={() => goToStep('welcome')} />

      <View style={styles.container}>
        <View style={styles.hero}>
          <RunOffLogo />

          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>RUN.</Text>
            <Text style={styles.headline}>COMPETE.</Text>
            <Text style={styles.headlineAccent}>CLIMB THE RANKS.</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {Platform.OS === 'ios' ? (
            <OnboardingAuthButton
              icon="logo-apple"
              label={activeProvider === 'apple' ? 'SIGNING IN…' : 'CONTINUE WITH APPLE'}
              onPress={activeProvider ? undefined : handleAppleSignIn}
            />
          ) : null}

          <OnboardingAuthButton
            icon="logo-google"
            label={activeProvider === 'google' ? 'SIGNING IN…' : 'CONTINUE WITH GOOGLE'}
            onPress={activeProvider || !googleConfigured ? undefined : handleGoogleSignIn}
          />

          <OnboardingAuthButton
            icon="mail-outline"
            label="CONTINUE WITH EMAIL"
            onPress={activeProvider ? undefined : () => goToStep('email')}
            variant="primary"
          />

          {activeProvider ? (
            <ActivityIndicator color={colors.accentLime} style={styles.spinner} />
          ) : null}

          {authError ? <Text style={styles.error}>{authError}</Text> : null}

          {!appleAvailable && Platform.OS === 'ios' ? (
            <Text style={styles.hint}>
              Apple Sign-In requires a dev build on a physical device or TestFlight.
            </Text>
          ) : null}

          {!googleConfigured ? (
            <Text style={styles.hint}>
              Add Google client IDs to .env and rebuild to enable Google sign-in.
            </Text>
          ) : null}
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
    paddingTop: spacing.xl,
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
  actions: {
    gap: spacing.sm,
  },
  spinner: {
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
