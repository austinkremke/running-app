import { useEffect, useState } from 'react';
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

type Stage = 'enterEmail' | 'enterCode';

const RESEND_COOLDOWN_SECONDS = 30;
// Supabase's OTP length is configurable project-side (not always 6), so this
// only guards against an obviously incomplete code rather than an exact length.
const MIN_CODE_LENGTH = 4;
const MAX_CODE_LENGTH = 10;

export function OnboardingEmailScreen() {
  const { goToStep } = useOnboarding();
  const { sendEmailOtp, verifyEmailOtp, authError, clearAuthError } = useAuth();

  const [stage, setStage] = useState<Stage>('enterEmail');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const errorMessage = localError ?? authError;

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSendCode() {
    clearAuthError();
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      await sendEmailOtp(trimmedEmail);
      setCode('');
      setStage('enterCode');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || submitting) return;

    clearAuthError();
    setLocalError(null);
    setSubmitting(true);
    try {
      await sendEmailOtp(email);
      setCode('');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    clearAuthError();
    setLocalError(null);

    if (code.trim().length < MIN_CODE_LENGTH) {
      setLocalError('Enter the code from your email.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyEmailOtp(email, code);
      goToStep('howItWorks');
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    clearAuthError();
    setLocalError(null);

    if (stage === 'enterCode') {
      setCode('');
      setStage('enterEmail');
      return;
    }

    goToStep('login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <OnboardingScreenHeader
            onBack={handleBack}
            title={stage === 'enterEmail' ? 'CONTINUE WITH EMAIL' : 'ENTER CODE'}
          />

          {stage === 'enterEmail' ? (
            <View style={styles.form}>
              <Text style={styles.hint}>We'll email you a code to sign in — no password needed.</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />

              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

              <OnboardingPrimaryButton
                label={submitting ? 'SENDING…' : 'SEND CODE'}
                onPress={submitting ? undefined : handleSendCode}
              />

              {submitting ? (
                <ActivityIndicator color={colors.accentLime} style={styles.spinner} />
              ) : null}
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.hint}>We sent a code to {email}</Text>

              <TextInput
                autoFocus
                keyboardType="number-pad"
                maxLength={MAX_CODE_LENGTH}
                onChangeText={setCode}
                placeholder="Code from your email"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                textContentType="oneTimeCode"
                value={code}
              />

              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

              <OnboardingPrimaryButton
                label={submitting ? 'VERIFYING…' : 'VERIFY'}
                onPress={submitting ? undefined : handleVerifyCode}
              />

              {submitting ? (
                <ActivityIndicator color={colors.accentLime} style={styles.spinner} />
              ) : null}

              <Pressable
                disabled={resendCooldown > 0 || submitting}
                onPress={handleResendCode}
                style={styles.toggle}
              >
                <Text style={[styles.toggleText, resendCooldown > 0 && styles.toggleTextDisabled]}>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </Text>
              </Pressable>
            </View>
          )}
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
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
  toggleTextDisabled: {
    color: colors.textSecondary,
  },
});
