export type OnboardingNpcOpponent = {
  name: string;
  avatarUrl: string;
  level: number;
  rankTitle: string;
  rankIcon: string;
  wins: number;
  losses: number;
};

export const MOCK_ONBOARDING_NPC: OnboardingNpcOpponent = {
  name: 'Marcus',
  avatarUrl:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  level: 12,
  rankTitle: 'RISING RUNNER',
  rankIcon: 'footsteps',
  wins: 8,
  losses: 4,
};
