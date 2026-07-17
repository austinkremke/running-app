import type { Team, TeamMember } from './types';

const AVATARS = [
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1546456073-92b9f0a8d413?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop',
];

const MEMBERS: TeamMember[] = [
  { id: 'member-1', rank: 1, name: 'Morgan Lee', status: 'Leader', isOnline: true, role: 'leader', avatarUrl: AVATARS[0], level: 41, distance: '312.4 mi', power: '1,842' },
  { id: 'member-2', rank: 2, name: 'Casey Nguyen', status: 'Co-Leader', isOnline: true, role: 'co-leader', avatarUrl: AVATARS[1], level: 37, distance: '289.1 mi', power: '1,705' },
  { id: 'member-3', rank: 3, name: 'Riley Cooper', status: 'Active today', isOnline: true, avatarUrl: AVATARS[2], level: 33, distance: '254.8 mi', power: '1,522' },
  { id: 'member-4', rank: 4, name: 'Jordan Blake', status: 'Active today', isOnline: false, avatarUrl: AVATARS[3], level: 29, distance: '201.6 mi', power: '1,338' },
  { id: 'member-5', rank: 5, name: 'Taylor Reed', status: '2 hours ago', isOnline: false, avatarUrl: AVATARS[4], level: 26, distance: '176.2 mi', power: '1,190' },
  { id: 'member-6', rank: 6, name: 'Avery Sloan', status: 'Yesterday', isOnline: false, avatarUrl: AVATARS[5], level: 22, distance: '142.9 mi', power: '1,004' },
];

export const MOCK_TEAM_SCREENSHOT: Team = {
  id: 'team-screenshot',
  name: 'Midnight Runners',
  tag: 'MDNT',
  motto: 'Outrun the sunrise.',
  level: 34,
  competitiveRating: 2145,
  teamRank: {
    rank: 128,
    topPercent: 'Top 5%',
    subtitle: 'Season 4',
    tierId: 'gold',
    tierTitle: 'Gold',
  },
  shieldIcon: 'flash',
  shieldAccent: 'lime',
  stats: [
    { id: 'distance', icon: 'footsteps-outline', iconColor: '#E3FF6A', label: 'Total Distance', value: '1,376.9 mi', sublabel: 'This season' },
    { id: 'runs', icon: 'pulse-outline', iconColor: '#9D7BFF', label: 'Runs Logged', value: '412', sublabel: 'This season' },
    { id: 'wins', icon: 'trophy-outline', iconColor: '#FFC94A', label: 'Match Wins', value: '58', sublabel: '72% win rate' },
    { id: 'streak', icon: 'flame-outline', iconColor: '#FF7A59', label: 'Team Streak', value: '9 Days', sublabel: 'Keep it up' },
  ],
  members: MEMBERS,
  memberCount: MEMBERS.length,
  memberMax: 8,
};
