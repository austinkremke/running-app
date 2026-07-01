export type OnboardingNpcOpponent = {
  name: string;
  avatarUrl: string;
  level: number;
  rankTitle: string;
  rankTierId?: string;
  competitiveRating?: number;
  wins: number;
  losses: number;
};

export const MOCK_ONBOARDING_NPC: OnboardingNpcOpponent = {
  name: 'Marcus',
  avatarUrl:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  level: 12,
  rankTitle: 'BRONZE RUNNER',
  rankTierId: 'bronze',
  competitiveRating: 1050,
  wins: 8,
  losses: 4,
};
