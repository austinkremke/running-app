import { useEffect, useState } from 'react';

import { OnboardingChallengeDrawer } from '../components/onboarding';
import { useAuth, useOnboarding } from '../context';
import { MOCK_ONBOARDING_NPC } from '../mock/onboardingNpc';
import { AuthLoadingScreen } from '../screens/onboarding/AuthLoadingScreen';
import { AppShell } from './AppShell';
import { OnboardingShell } from './OnboardingShell';

const CHALLENGE_DRAWER_DELAY_MS = 2000;

export function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const {
    hasCompletedOnboarding,
    onboardingReady,
    step,
    showChallengeDrawer,
    acceptChallenge,
    dismissChallenge,
  } = useOnboarding();
  const [challengeDrawerVisible, setChallengeDrawerVisible] = useState(false);

  useEffect(() => {
    if (!showChallengeDrawer) {
      setChallengeDrawerVisible(false);
      return;
    }

    const timeout = setTimeout(() => {
      setChallengeDrawerVisible(true);
    }, CHALLENGE_DRAWER_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [showChallengeDrawer]);

  if (authLoading || (session && !onboardingReady)) {
    return <AuthLoadingScreen />;
  }

  if (!session || !hasCompletedOnboarding) {
    return <OnboardingShell step={session ? (step === 'login' ? 'howItWorks' : step) : 'login'} />;
  }

  return (
    <>
      <AppShell />
      <OnboardingChallengeDrawer
        onAccept={acceptChallenge}
        onRunLater={dismissChallenge}
        opponent={MOCK_ONBOARDING_NPC}
        visible={challengeDrawerVisible}
      />
    </>
  );
}
