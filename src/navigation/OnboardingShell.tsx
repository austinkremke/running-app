import type { OnboardingStep } from '../context';
import { useOnboarding } from '../context';
import {
  OnboardingEmailScreen,
  OnboardingLoginScreen,
  OnboardingTutorialScreen,
} from '../screens/onboarding';

type OnboardingShellProps = {
  step: OnboardingStep;
};

export function OnboardingShell({ step }: OnboardingShellProps) {
  const { completeOnboarding } = useOnboarding();

  switch (step) {
    case 'email':
      return <OnboardingEmailScreen />;
    case 'howItWorks':
      return (
        <OnboardingTutorialScreen
          onFindFirstMatch={() => {
            void completeOnboarding({ showChallengeDrawer: true });
          }}
          onSkip={() => {
            void completeOnboarding();
          }}
        />
      );
    case 'login':
    default:
      return <OnboardingLoginScreen />;
  }
}
