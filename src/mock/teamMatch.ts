import type { ActiveTeamMatch } from './types';

const AVATARS = {
  austin:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  tyler:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  chris:
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  jake:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  ryan:
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
  sarah:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  mike:
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  emma:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  luke:
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  noah:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
};

export const MOCK_ACTIVE_TEAM_MATCH: ActiveTeamMatch = {
  id: 'match-road-warriors-pacers',
  homeTeam: {
    id: 'team-road-warriors',
    name: 'Road Warriors',
    totalPoints: 1248,
    accent: 'lime',
    shieldIcon: 'paw',
    members: [
      {
        id: 'rw-austin',
        name: 'Austin',
        level: 24,
        avatarUrl: AVATARS.austin,
        points: 412,
        challengeStats: { distanceMiles: 18.6, pacePerMile: '7:12' },
        isLeader: true,
      },
      {
        id: 'rw-tyler',
        name: 'Tyler',
        level: 18,
        avatarUrl: AVATARS.tyler,
        points: 299,
        challengeStats: { distanceMiles: 12.4, pacePerMile: '7:48' },
      },
      {
        id: 'rw-chris',
        name: 'Chris',
        level: 15,
        avatarUrl: AVATARS.chris,
        points: 246,
        challengeStats: { distanceMiles: 14.1, pacePerMile: '8:05' },
      },
      {
        id: 'rw-jake',
        name: 'Jake',
        level: 17,
        avatarUrl: AVATARS.jake,
        points: 156,
        challengeStats: { distanceMiles: 8.2, pacePerMile: '8:22' },
      },
      {
        id: 'rw-ryan',
        name: 'Ryan',
        level: 14,
        avatarUrl: AVATARS.ryan,
        points: 135,
        challengeStats: { distanceMiles: 7.5, pacePerMile: '8:41' },
      },
    ],
  },
  awayTeam: {
    id: 'team-pacers',
    name: 'Pacers',
    totalPoints: 1181,
    accent: 'purple',
    shieldIcon: 'fitness',
    members: [
      {
        id: 'pacers-sarah',
        name: 'Sarah',
        level: 17,
        avatarUrl: AVATARS.sarah,
        points: 384,
        challengeStats: { distanceMiles: 15.8, pacePerMile: '7:34' },
        isLeader: true,
      },
      {
        id: 'pacers-mike',
        name: 'Mike',
        level: 15,
        avatarUrl: AVATARS.mike,
        points: 271,
        challengeStats: { distanceMiles: 11.2, pacePerMile: '7:56' },
      },
      {
        id: 'pacers-emma',
        name: 'Emma',
        level: 14,
        avatarUrl: AVATARS.emma,
        points: 236,
        challengeStats: { distanceMiles: 10.2, pacePerMile: '8:11' },
      },
      {
        id: 'pacers-luke',
        name: 'Luke',
        level: 13,
        avatarUrl: AVATARS.luke,
        points: 189,
        challengeStats: { distanceMiles: 9.4, pacePerMile: '8:28' },
      },
      {
        id: 'pacers-noah',
        name: 'Noah',
        level: 12,
        avatarUrl: AVATARS.noah,
        points: 101,
        challengeStats: { distanceMiles: 5.6, pacePerMile: '8:55' },
      },
    ],
  },
  countdown: {
    days: 3,
    hours: 14,
    minutes: 22,
  },
  activities: [
    {
      id: 'activity-1',
      avatarUrl: AVATARS.austin,
      playerName: 'Austin',
      description: 'ran 5.2 miles',
      pointsEarned: 54,
      timeAgo: '2m ago',
      accent: 'lime',
    },
    {
      id: 'activity-2',
      avatarUrl: AVATARS.tyler,
      playerName: 'Tyler',
      description: 'completed 4.8 miles',
      pointsEarned: 48,
      timeAgo: '10m ago',
      accent: 'lime',
    },
    {
      id: 'activity-3',
      avatarUrl: AVATARS.sarah,
      playerName: 'Sarah',
      description: 'ran 3.9 miles',
      pointsEarned: 41,
      timeAgo: '18m ago',
      accent: 'purple',
    },
    {
      id: 'activity-4',
      avatarUrl: AVATARS.chris,
      playerName: 'Chris',
      description: 'completed 6.1 miles',
      pointsEarned: 62,
      timeAgo: '32m ago',
      accent: 'lime',
    },
  ],
};
