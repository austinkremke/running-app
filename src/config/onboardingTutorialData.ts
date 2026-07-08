/** Fake sample data for the first-run onboarding tutorial only — never real user data. */

export const TUTORIAL_USER = {
  name: 'You',
  rank: 'Gold III',
  rankTierId: 'gold',
  power: 1842,
};

export const TUTORIAL_OPPONENT_CANDIDATES = ['Casey', 'Morgan', 'Riley', 'Taylor', 'Sam'];

export const TUTORIAL_OPPONENT = {
  name: 'Jordan',
  rank: 'Gold III',
  rankTierId: 'gold',
  power: 1821,
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
  powerGain: 32,
  previousPower: 1842,
  newPower: 1874,
  rankProgress: 0.62,
};

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
