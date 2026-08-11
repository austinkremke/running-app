import type { SoloMatchmaking } from './types';

export const MOCK_SOLO_MATCHMAKING: SoloMatchmaking = {
  name: 'Austin',
  avatarUrl:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  level: 24,
  rankTitle: 'ELITE RUNNER',
  rankIcon: 'star',
  matchFormat: {
    title: 'Solo Match',
    durationLabel: '3 Days',
    winCondition: 'Highest score wins',
    overview:
      'You have 3 days to outscore your opponent head-to-head. Every run you log during the match counts toward your total.',
    scoringDetails:
      'Distance sets your base score (~10 pts/mi). Faster pace than 10:00/mi boosts points up to 25%; slower pace reduces them down to 15%.',
  },
  seasonRecord: {
    wins: 18,
    losses: 6,
    bestStreak: 7,
  },
};
