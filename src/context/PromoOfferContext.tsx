import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { LEVEL_10_BOOST_OFFER, type PromoOffer } from '../config/promoOffers';

type PromoOfferContextValue = {
  /** The offer to show, or null once dismissed for this app session. */
  activeOffer: PromoOffer | null;
  dismiss: () => void;
};

const PromoOfferContext = createContext<PromoOfferContextValue | null>(null);

export function PromoOfferProvider({ children }: { children: ReactNode }) {
  // Plain in-memory state, deliberately not persisted — dismissing only
  // hides it for the current app session (this provider's mount lifetime).
  // The next cold launch remounts the provider and offers it again.
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => setDismissed(true), []);

  // No level-gating yet — shown to every user regardless of their current
  // level so it can be tested; this is the first slot for a system that
  // will eventually pick from multiple candidate offers.
  const activeOffer = dismissed ? null : LEVEL_10_BOOST_OFFER;

  const value = useMemo(() => ({ activeOffer, dismiss }), [activeOffer, dismiss]);

  return <PromoOfferContext.Provider value={value}>{children}</PromoOfferContext.Provider>;
}

export function usePromoOffer() {
  const context = useContext(PromoOfferContext);
  if (!context) {
    throw new Error('usePromoOffer must be used within PromoOfferProvider');
  }
  return context;
}
