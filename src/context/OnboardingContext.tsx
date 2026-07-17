import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { markOnboardingCompleted } from '../services/profileService';
import {
  readOnboardingCompleted,
  writeOnboardingCompleted,
} from '../storage/onboardingStorage';
import { useAuth } from './AuthContext';

export type OnboardingStep = 'welcome' | 'login' | 'email' | 'howItWorks';

type OnboardingContextValue = {
  step: OnboardingStep;
  hasCompletedOnboarding: boolean;
  onboardingReady: boolean;
  goToStep: (step: OnboardingStep) => void;
  completeOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOnboardingState() {
      if (!userId) {
        setHasCompletedOnboarding(false);
        setStep('welcome');
        setOnboardingReady(true);
        return;
      }

      setOnboardingReady(false);
      const completedLocally = await readOnboardingCompleted(userId);
      if (cancelled) return;

      setHasCompletedOnboarding(completedLocally);
      setStep('howItWorks');
      setOnboardingReady(true);
    }

    loadOnboardingState().catch((error) => {
      console.error('Failed to load onboarding state', error);
      if (!cancelled) {
        setOnboardingReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const goToStep = useCallback((nextStep: OnboardingStep) => {
    setStep(nextStep);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);

    if (userId) {
      await writeOnboardingCompleted(userId);
      markOnboardingCompleted(userId).catch((error) => {
        console.error('Failed to sync onboarding completion', error);
      });
    }
  }, [userId]);

  return (
    <OnboardingContext.Provider
      value={{
        step,
        hasCompletedOnboarding,
        onboardingReady,
        goToStep,
        completeOnboarding,
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
