import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider } from './src/context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
