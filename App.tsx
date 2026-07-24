import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  AuthProvider,
  OnboardingProvider,
  PendingActivityConfirmationProvider,
  PlayerProgressProvider,
  PromoOfferProvider,
  PurchasesProvider,
  RunProvider,
  XpGainProvider,
} from './src/context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PurchasesProvider>
          <PlayerProgressProvider>
            <XpGainProvider>
              <PendingActivityConfirmationProvider>
                <PromoOfferProvider>
                  <OnboardingProvider>
                    <RunProvider>
                      <StatusBar style="light" />
                      <RootNavigator />
                    </RunProvider>
                  </OnboardingProvider>
                </PromoOfferProvider>
              </PendingActivityConfirmationProvider>
            </XpGainProvider>
          </PlayerProgressProvider>
        </PurchasesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
