import { MOCK_ACTIVE_SOLO_MATCH } from './soloActiveMatch';
import type { ActiveSoloMatch } from './types';

const AVATARS = {
  home: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop',
  away: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
};

export const MOCK_SOLO_MATCH_SCREENSHOT: ActiveSoloMatch = {
  ...MOCK_ACTIVE_SOLO_MATCH,
  homeRunner: {
    id: 'runner-screenshot-home',
    name: 'Alex Carter',
    level: 32,
    avatarUrl: AVATARS.home,
    totalPoints: 155,
    accent: 'lime',
    rankTierId: 'gold',
  },
  awayRunner: {
    id: 'runner-screenshot-away',
    name: 'Jamie Ross',
    level: 27,
    avatarUrl: AVATARS.away,
    totalPoints: 120,
    accent: 'purple',
    rankTierId: 'silver',
  },
  countdown: {
    days: 1,
    hours: 6,
    minutes: 12,
    seconds: 0,
  },
  stats: [
    {
      id: 'points',
      label: 'Points',
      icon: 'trophy-outline',
      homeValue: '155',
      awayValue: '120',
      homeProgress: 155 / (155 + 120),
    },
    {
      id: 'distance',
      label: 'Distance',
      icon: 'footsteps-outline',
      homeValue: '14.82 mi',
      awayValue: '12.05 mi',
      homeProgress: 14.82 / (14.82 + 12.05),
    },
    {
      id: 'moving-time',
      label: 'Moving Time',
      icon: 'time-outline',
      homeValue: '1:58:24',
      awayValue: '1:42:10',
      homeProgress: 7104 / (7104 + 6130),
    },
  ],
};
