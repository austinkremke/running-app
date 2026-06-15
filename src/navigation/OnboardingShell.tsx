import type { OnboardingStep } from '../context';
import { OnboardingHowItWorksScreen, OnboardingLoginScreen } from '../screens/onboarding';

type OnboardingShellProps = {
  step: OnboardingStep;
};

export function OnboardingShell({ step }: OnboardingShellProps) {
  switch (step) {
    case 'howItWorks':
      return <OnboardingHowItWorksScreen />;
    case 'login':
    default:
      return <OnboardingLoginScreen />;
  }
}
