import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, OnboardingProvider, PlayerProgressProvider, RunProvider, SoloMatchCompletionProvider, XpGainProvider } from './src/context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProgressProvider>
          <XpGainProvider>
            <SoloMatchCompletionProvider>
              <OnboardingProvider>
                <RunProvider>
                  <StatusBar style="light" />
                  <RootNavigator />
                </RunProvider>
              </OnboardingProvider>
            </SoloMatchCompletionProvider>
          </XpGainProvider>
        </PlayerProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
