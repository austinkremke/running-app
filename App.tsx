import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider, RunProvider } from './src/context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <RunProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </RunProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
