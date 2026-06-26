import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, OnboardingProvider, PlayerProgressProvider, RunProvider } from './src/context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProgressProvider>
          <OnboardingProvider>
            <RunProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </RunProvider>
          </OnboardingProvider>
        </PlayerProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
