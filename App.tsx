import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  AuthProvider,
  OnboardingProvider,
  PendingActivityConfirmationProvider,
  PlayerProgressProvider,
  RunProvider,
  XpGainProvider,
} from './src/context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProgressProvider>
          <XpGainProvider>
            <PendingActivityConfirmationProvider>
              <OnboardingProvider>
                <RunProvider>
                  <StatusBar style="light" />
                  <RootNavigator />
                </RunProvider>
              </OnboardingProvider>
            </PendingActivityConfirmationProvider>
          </XpGainProvider>
        </PlayerProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
