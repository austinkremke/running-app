import type { Ionicons } from '@expo/vector-icons';

export type PromoOffer = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
};

/** First IAP offering — content/pricing still TBD, wired up as a placeholder card for now. */
export const LEVEL_10_BOOST_OFFER: PromoOffer = {
  id: 'level_10_boost',
  icon: 'flash',
  title: 'Level 10 Boost',
  description: 'Skip the grind — jump straight to Level 10 and unlock team creation instantly.',
  ctaLabel: 'Unlock for $4.99',
};
