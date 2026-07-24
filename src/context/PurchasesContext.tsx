import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { PRO_ENTITLEMENT_ID } from '../config/purchases';
import { useUserId } from './AuthContext';

type PurchasesContextValue = {
  /** True once the SDK has an entitlements answer for this user (avoids a premium-UI flash while loading). */
  isReady: boolean;
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  /** The current offering, if RevenueCat/store products are configured. Null in dev with placeholder keys. */
  offering: PurchasesOffering | null;
  purchasePackage: (pkg: PurchasesOffering['availablePackages'][number]) => Promise<void>;
  restorePurchases: () => Promise<void>;
  /** Presents RevenueCat's hosted paywall UI (configured in the dashboard) for the current offering. */
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  /** Presents the paywall only if Run Off Pro isn't already active — use this at feature gates. */
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  /** Presents RevenueCat's hosted Customer Center (manage/cancel subscription, refunds, restore). */
  presentCustomerCenter: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function customerInfoIsPremium(info: CustomerInfo): boolean {
  return typeof info.entitlements.active[PRO_ENTITLEMENT_ID] !== 'undefined';
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const userId = useUserId();
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    });

    if (!apiKey) {
      // No RevenueCat project wired up yet — fail open to non-premium rather
      // than throwing, so the app still runs before real keys exist.
      console.warn('RevenueCat API key missing; purchases disabled.');
      setIsReady(true);
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });

    const applyCustomerInfo = (info: CustomerInfo) => {
      setCustomerInfo(info);
      setIsPremium(customerInfoIsPremium(info));
    };

    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);

    Purchases.getCustomerInfo()
      .then(applyCustomerInfo)
      .catch((error) => console.warn('Failed to fetch RevenueCat customer info', error))
      .finally(() => setIsReady(true));

    Purchases.getOfferings()
      .then((offerings) => setOffering(offerings.current))
      .catch((error) => console.warn('Failed to fetch RevenueCat offerings', error));

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    Purchases.logIn(userId).catch((error) => console.warn('RevenueCat logIn failed', error));
  }, [userId]);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      isReady,
      isPremium,
      customerInfo,
      offering,
      purchasePackage: async (pkg) => {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        setCustomerInfo(info);
        setIsPremium(customerInfoIsPremium(info));
      },
      restorePurchases: async () => {
        const info = await Purchases.restorePurchases();
        setCustomerInfo(info);
        setIsPremium(customerInfoIsPremium(info));
      },
      presentPaywall: async () => {
        const result = await RevenueCatUI.presentPaywall({ offering: offering ?? undefined });
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        setIsPremium(customerInfoIsPremium(info));
        return result;
      },
      presentPaywallIfNeeded: async () => {
        const result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
          offering: offering ?? undefined,
        });
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        setIsPremium(customerInfoIsPremium(info));
        return result;
      },
      presentCustomerCenter: async () => {
        await RevenueCatUI.presentCustomerCenter();
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        setIsPremium(customerInfoIsPremium(info));
      },
    }),
    [isReady, isPremium, customerInfo, offering],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error('usePurchases must be used within PurchasesProvider');
  }
  return context;
}
