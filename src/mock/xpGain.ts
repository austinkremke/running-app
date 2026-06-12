import type { XpGainEvent } from './types';

export const MOCK_XP_GAIN_NORMAL: XpGainEvent = {
  xpEarned: 420,
  startingLevel: 24,
  startingXp: 6250,
  xpToNextLevel: 10000,
  runSummary: {
    distance: '3.42 mi',
    duration: '28:14',
    pace: '8:15 /mi',
  },
};

export const MOCK_XP_GAIN_LEVEL_UP: XpGainEvent = {
  xpEarned: 4200,
  startingLevel: 24,
  startingXp: 6250,
  xpToNextLevel: 10000,
  runSummary: {
    distance: '5.73 mi',
    duration: '47:02',
    pace: '8:12 /mi',
  },
};
