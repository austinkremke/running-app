import { useEffect, useState } from 'react';

import { OnboardingChallengeDrawer } from '../components/onboarding';
import { useOnboarding } from '../context';
import { MOCK_ONBOARDING_NPC } from '../mock/onboardingNpc';
import { AppShell } from './AppShell';
import { OnboardingShell } from './OnboardingShell';

const CHALLENGE_DRAWER_DELAY_MS = 2000;

export function RootNavigator() {
  const {
    hasCompletedOnboarding,
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

  if (!hasCompletedOnboarding) {
    return <OnboardingShell step={step} />;
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
