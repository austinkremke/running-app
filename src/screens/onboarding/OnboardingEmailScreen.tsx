import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPrimaryButton, OnboardingScreenHeader } from '../../components/onboarding';
import { useAuth, useOnboarding } from '../../context';
import { colors, spacing } from '../../theme';

type EmailMode = 'signIn' | 'signUp';

export function OnboardingEmailScreen() {
  const { goToStep } = useOnboarding();
  const { signInWithEmail, signUpWithEmail, authError, clearAuthError } = useAuth();

  const [mode, setMode] = useState<EmailMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage = localError ?? authError;

  async function handleSubmit() {
    clearAuthError();
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalError('Email and password are required.');
      return;
    }

    if (mode === 'signUp' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signUp') {
        await signUpWithEmail(trimmedEmail, password, displayName);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
      goToStep('howItWorks');
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    clearAuthError();
    setLocalError(null);
    setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <OnboardingScreenHeader
            onBack={() => goToStep('login')}
            title={mode === 'signIn' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          />

          <View style={styles.form}>
            {mode === 'signUp' ? (
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setDisplayName}
                placeholder="Display name"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={displayName}
              />
            ) : null}

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={styles.input}
              textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              value={password}
            />

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <OnboardingPrimaryButton
              label={submitting ? 'WORKING…' : mode === 'signIn' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              onPress={submitting ? undefined : handleSubmit}
            />

            {submitting ? (
              <ActivityIndicator color={colors.accentLime} style={styles.spinner} />
            ) : null}
          </View>

          <Pressable onPress={toggleMode} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {mode === 'signIn'
                ? 'Need an account? Create one'
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  spinner: {
    marginTop: spacing.sm,
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  toggleText: {
    color: colors.accentLime,
    fontSize: 14,
    fontWeight: '700',
  },
});
