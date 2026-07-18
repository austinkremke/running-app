import {
  useAuth,
  useOnboarding,
  SoloMatchCompletionProvider,
  TeamMatchCompletionProvider,
  InAppNotificationProvider,
} from '../context';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { AuthLoadingScreen } from '../screens/onboarding/AuthLoadingScreen';
import { AppShell } from './AppShell';
import { OnboardingShell } from './OnboardingShell';

export function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, onboardingReady, step } = useOnboarding();

  usePushRegistration(session?.user?.id ?? null);

  if (authLoading || (session && !onboardingReady)) {
    return <AuthLoadingScreen />;
  }

  if (!session || !hasCompletedOnboarding) {
    const preAuthStep = step === 'welcome' || step === 'login';
    return <OnboardingShell step={session && preAuthStep ? 'howItWorks' : step} />;
  }

  return (
    <InAppNotificationProvider>
      <SoloMatchCompletionProvider>
        <TeamMatchCompletionProvider>
          <AppShell />
        </TeamMatchCompletionProvider>
      </SoloMatchCompletionProvider>
    </InAppNotificationProvider>
  );
}
