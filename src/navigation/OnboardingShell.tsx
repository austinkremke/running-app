import type { OnboardingStep } from '../context';
import {
  OnboardingEmailScreen,
  OnboardingHowItWorksScreen,
  OnboardingLoginScreen,
} from '../screens/onboarding';

type OnboardingShellProps = {
  step: OnboardingStep;
};

export function OnboardingShell({ step }: OnboardingShellProps) {
  switch (step) {
    case 'email':
      return <OnboardingEmailScreen />;
    case 'howItWorks':
      return <OnboardingHowItWorksScreen />;
    case 'login':
    default:
      return <OnboardingLoginScreen />;
  }
}
