import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type AuthProvider = 'apple' | 'google' | 'email';

export type OnboardingStep = 'login' | 'howItWorks';

type OnboardingContextValue = {
  step: OnboardingStep;
  hasCompletedOnboarding: boolean;
  showChallengeDrawer: boolean;
  shouldOpenSoloMatch: boolean;
  goToStep: (step: OnboardingStep) => void;
  mockSignIn: (provider: AuthProvider) => void;
  completeOnboarding: (options?: { showChallengeDrawer?: boolean }) => void;
  acceptChallenge: () => void;
  dismissChallenge: () => void;
  consumeSoloMatchNavigation: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<OnboardingStep>('login');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showChallengeDrawer, setShowChallengeDrawer] = useState(false);
  const [shouldOpenSoloMatch, setShouldOpenSoloMatch] = useState(false);

  const goToStep = useCallback((nextStep: OnboardingStep) => {
    setStep(nextStep);
  }, []);

  const mockSignIn = useCallback(
    (_provider: AuthProvider) => {
      goToStep('howItWorks');
    },
    [goToStep],
  );

  const completeOnboarding = useCallback((options?: { showChallengeDrawer?: boolean }) => {
    setHasCompletedOnboarding(true);
    if (options?.showChallengeDrawer) {
      setShowChallengeDrawer(true);
    }
  }, []);

  const acceptChallenge = useCallback(() => {
    setShowChallengeDrawer(false);
    setShouldOpenSoloMatch(true);
  }, []);

  const dismissChallenge = useCallback(() => {
    setShowChallengeDrawer(false);
  }, []);

  const consumeSoloMatchNavigation = useCallback(() => {
    setShouldOpenSoloMatch(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        step,
        hasCompletedOnboarding,
        showChallengeDrawer,
        shouldOpenSoloMatch,
        goToStep,
        mockSignIn,
        completeOnboarding,
        acceptChallenge,
        dismissChallenge,
        consumeSoloMatchNavigation,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }

  return context;
}
