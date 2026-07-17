import type { OnboardingStep } from '../context';
import { useOnboarding } from '../context';
import {
  OnboardingEmailScreen,
  OnboardingLoginScreen,
  OnboardingTutorialScreen,
  OnboardingWelcomeScreen,
} from '../screens/onboarding';

type OnboardingShellProps = {
  step: OnboardingStep;
};

export function OnboardingShell({ step }: OnboardingShellProps) {
  const { completeOnboarding, goToStep } = useOnboarding();

  switch (step) {
    case 'login':
      return <OnboardingLoginScreen />;
    case 'email':
      return <OnboardingEmailScreen />;
    case 'howItWorks':
      return (
        <OnboardingTutorialScreen
          onFindFirstMatch={() => {
            void completeOnboarding();
          }}
          onSkip={() => {
            void completeOnboarding();
          }}
        />
      );
    case 'welcome':
    default:
      return (
        <OnboardingWelcomeScreen
          onJoin={() => goToStep('login')}
          onLogin={() => goToStep('login')}
        />
      );
  }
}
