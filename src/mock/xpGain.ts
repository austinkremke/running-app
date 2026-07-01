import type { XpGainEvent } from './types';

export const MOCK_XP_GAIN_NORMAL: XpGainEvent = {
  source: 'run',
  xpEarned: 420,
  startingLevel: 24,
  startingXp: 6250,
  xpToNextLevel: 10000,
  runSummary: {
    distance: '3.42 mi',
    duration: '28:14',
    pace: '8:15 /mi',
  },
  breakdown: [
    { key: 'distance', label: 'Distance', detail: '3.42 mi', xp: 300 },
    { key: 'pace', label: 'Pace effort', detail: '8:15/mi vs your 8:45 avg', xp: 45 },
    { key: 'streak', label: '5-day streak', detail: '×1.25 on base XP', xp: 25 },
    { key: 'first-run-today', label: 'First run today', detail: 'Daily bonus', xp: 50 },
  ],
};

export const MOCK_XP_GAIN_LEVEL_UP: XpGainEvent = {
  source: 'run',
  xpEarned: 4200,
  startingLevel: 24,
  startingXp: 6250,
  xpToNextLevel: 10000,
  runSummary: {
    distance: '5.73 mi',
    duration: '47:02',
    pace: '8:12 /mi',
  },
  breakdown: [
    { key: 'distance', label: 'Distance', detail: '5.73 mi', xp: 3500 },
    { key: 'pace', label: 'Pace effort', detail: '8:12/mi vs your 8:30 avg', xp: 350 },
    { key: 'elevation', label: 'Elevation', detail: '+240 ft climbed', xp: 200 },
    { key: 'streak', label: '7-day streak', detail: '×1.35 on base XP', xp: 150 },
  ],
};

export const MOCK_XP_GAIN_COMBINED: XpGainEvent = {
  source: 'combined',
  xpEarned: 520,
  startingLevel: 24,
  startingXp: 6250,
  xpToNextLevel: 10000,
  runSummary: MOCK_XP_GAIN_NORMAL.runSummary,
  achievementSummary: [
    {
      id: 'first_run',
      displayName: 'First Run',
      tier: 'bronze',
      icon: 'footsteps',
      category: 'distance',
    },
  ],
  breakdown: [
    ...(MOCK_XP_GAIN_NORMAL.breakdown ?? []),
    {
      key: 'achievement',
      label: 'First Run',
      detail: 'Bronze · Distance',
      xp: 100,
    },
  ],
};
