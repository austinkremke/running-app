import type { Matchmaking } from './types';

const AVATARS = {
  austin:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  tyler:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  jake:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  chris:
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  ryan:
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
  kevin:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  nate:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  dylan:
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  lucas:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
};

export const MOCK_MATCHMAKING: Matchmaking = {
  teamName: 'Road Warriors',
  powerRating: 7821,
  teamLevel: 24,
  shieldIcon: 'paw',
  shieldAccent: 'lime',
  matchFormat: {
    title: 'Team Match',
    durationLabel: '3 Days',
    winCondition: 'Highest team score wins',
    overview:
      'Your lineup has 3 days to earn as many points as possible. Every run from your selected runners counts toward your team total.',
    scoringDetails:
      'Points come from your team\'s combined distance and pace—the more miles your lineup covers, and the faster they run them, the higher your score.',
  },
  maxLineup: 5,
  lineup: [
    {
      id: 'runner-austin',
      name: 'Austin',
      level: 24,
      role: 'leader',
      avatarUrl: AVATARS.austin,
      seasonAvg: '8.43 mi',
      totalMiles: '312.8 mi',
    },
    {
      id: 'runner-tyler',
      name: 'Tyler',
      level: 18,
      role: 'co-leader',
      avatarUrl: AVATARS.tyler,
      seasonAvg: '7.92 mi',
      totalMiles: '248.5 mi',
    },
    {
      id: 'runner-jake',
      name: 'Jake',
      level: 17,
      avatarUrl: AVATARS.jake,
      seasonAvg: '7.15 mi',
      totalMiles: '198.2 mi',
    },
    {
      id: 'runner-chris',
      name: 'Chris',
      level: 15,
      avatarUrl: AVATARS.chris,
      seasonAvg: '6.84 mi',
      totalMiles: '176.4 mi',
    },
    {
      id: 'runner-ryan',
      name: 'Ryan',
      level: 14,
      avatarUrl: AVATARS.ryan,
      seasonAvg: '6.52 mi',
      totalMiles: '154.9 mi',
    },
  ],
  available: [
    {
      id: 'runner-kevin',
      name: 'Kevin',
      level: 13,
      avatarUrl: AVATARS.kevin,
      seasonAvg: '6.21 mi',
      totalMiles: '142.3 mi',
    },
    {
      id: 'runner-nate',
      name: 'Nate',
      level: 12,
      avatarUrl: AVATARS.nate,
      seasonAvg: '5.98 mi',
      totalMiles: '128.7 mi',
    },
    {
      id: 'runner-dylan',
      name: 'Dylan',
      level: 11,
      avatarUrl: AVATARS.dylan,
      seasonAvg: '5.74 mi',
      totalMiles: '115.2 mi',
    },
    {
      id: 'runner-lucas',
      name: 'Lucas',
      level: 10,
      avatarUrl: AVATARS.lucas,
      seasonAvg: '5.41 mi',
      totalMiles: '98.6 mi',
    },
  ],
};
