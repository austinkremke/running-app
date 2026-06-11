import type { SoloMatchmaking } from './types';

export const MOCK_SOLO_MATCHMAKING: SoloMatchmaking = {
  name: 'Austin',
  avatarUrl:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  level: 24,
  rankTitle: 'ELITE RUNNER',
  rankIcon: 'star',
  matchFormat: {
    title: '3 Day Challenge',
    durationLabel: '3 Days',
    winCondition: 'Highest score wins',
    overview:
      'You have 3 days to outscore your opponent head-to-head. Every run you log during the match counts toward your total.',
    scoringDetails:
      'Points come from your cumulative distance and pace—the more miles you cover, and the faster you run them, the higher your score.',
  },
  seasonRecord: {
    wins: 18,
    losses: 6,
    bestStreak: 7,
  },
};
