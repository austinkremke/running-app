import type { OnboardingStep } from '../context';
import { useOnboarding } from '../context';
import {
  OnboardingEmailScreen,
  OnboardingLoginScreen,
  OnboardingTermsScreen,
  OnboardingTutorialScreen,
  OnboardingWelcomeScreen,
} from '../screens/onboarding';

type OnboardingShellProps = {
  step: OnboardingStep;
};

export function OnboardingShell({ step }: OnboardingShellProps) {
  const { completeOnboarding, goToStep } = useOnboarding();

  switch (step) {
    case 'terms':
      return (
        <OnboardingTermsScreen
          onAccept={() => {
            // Not signed in yet at this point in the pre-auth flow — the
            // acceptance itself is recorded server-side right after
            // sign-in succeeds (see AuthContext's post-session effect).
            goToStep('login');
          }}
        />
      );
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
          onJoin={() => goToStep('terms')}
          onLogin={() => goToStep('terms')}
        />
      );
  }
}
