import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, OnboardingProvider, PlayerProgressProvider, RunProvider, XpGainProvider } from './src/context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProgressProvider>
          <XpGainProvider>
            <OnboardingProvider>
              <RunProvider>
                <StatusBar style="light" />
                <RootNavigator />
              </RunProvider>
            </OnboardingProvider>
          </XpGainProvider>
        </PlayerProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
