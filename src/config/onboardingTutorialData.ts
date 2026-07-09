/** Fake sample data for the first-run onboarding tutorial only — never real user data. */

export const TUTORIAL_USER = {
  name: 'You',
  rank: 'Gold III',
  rankTierId: 'gold',
  power: 1842,
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  accent: 'lime' as const,
};

export const TUTORIAL_OPPONENT_CANDIDATES = ['Casey', 'Morgan', 'Riley', 'Taylor', 'Sam'];

export const TUTORIAL_OPPONENT = {
  name: 'Jordan',
  rank: 'Gold III',
  rankTierId: 'gold',
  power: 1821,
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  accent: 'purple' as const,
};

export const TUTORIAL_MATCH_TIMER = '18:00';

export const TUTORIAL_SCORING = {
  user: {
    distanceMiles: 2.4,
    pace: '8:12',
    score: 128,
  },
  opponent: {
    distanceMiles: 2.1,
    pace: '8:34',
    score: 103,
  },
  milestones: ['+24 distance', '+8 pace'],
};

export const TUTORIAL_RESULT = {
  userScore: 428,
  opponentScore: 391,
  powerGain: 50,
  previousPower: 1350,
  newPower: 1400,
  rankProgress: 0.62,
};

// Final order (top to bottom) once the climb finishes — "You" ends up #1.
export const TUTORIAL_RANK_LEADERBOARD = [
  {
    id: 'you',
    name: 'You',
    power: TUTORIAL_RESULT.newPower,
    level: 16,
    avatarUrl: TUTORIAL_USER.avatarUrl,
    isYou: true,
  },
  {
    id: 'jordan',
    name: 'Jordan',
    power: 1390,
    level: 15,
    avatarUrl: TUTORIAL_OPPONENT.avatarUrl,
    isYou: false,
  },
  {
    id: 'casey',
    name: 'Casey',
    power: 1375,
    level: 14,
    avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
    isYou: false,
  },
  {
    id: 'morgan',
    name: 'Morgan',
    power: 1360,
    level: 14,
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop',
    isYou: false,
  },
  {
    id: 'riley',
    name: 'Riley',
    power: 1340,
    level: 13,
    avatarUrl: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop',
    isYou: false,
  },
  {
    id: 'taylor',
    name: 'Taylor',
    power: 1310,
    level: 12,
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop',
    isYou: false,
  },
];

/** How many rows down "You" starts before climbing to the top of the leaderboard. */
export const TUTORIAL_RANK_CLIMB_START_OFFSET = 4;

export const TUTORIAL_TEAM = {
  name: 'Night Striders',
  rank: 18,
  weeklyPointsBefore: 12480,
  weeklyPointsAfter: 12840,
  memberCount: 6,
};

export const TUTORIAL_LEADERBOARD = [
  { name: 'Apex Run Club', points: 15210 },
  { name: 'Night Striders', points: 12840 },
  { name: 'Mile Hunters', points: 11960 },
];
