import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  AuthProvider,
  BlockedUsersProvider,
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <BlockedUsersProvider>
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
          </BlockedUsersProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
