import type { ChallengeFriend } from './types';

const AVATARS = {
  tyler:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  jake:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  chris:
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  ryan:
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
  nate:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  dylan:
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
};

export const MOCK_CHALLENGE_FRIENDS: ChallengeFriend[] = [
  {
    id: 'friend-tyler',
    name: 'Tyler',
    level: 18,
    avatarUrl: AVATARS.tyler,
    isOnline: true,
  },
  {
    id: 'friend-jake',
    name: 'Jake',
    level: 17,
    avatarUrl: AVATARS.jake,
    isOnline: true,
  },
  {
    id: 'friend-chris',
    name: 'Chris',
    level: 15,
    avatarUrl: AVATARS.chris,
    isOnline: false,
  },
  {
    id: 'friend-ryan',
    name: 'Ryan',
    level: 14,
    avatarUrl: AVATARS.ryan,
    isOnline: true,
  },
  {
    id: 'friend-nate',
    name: 'Nate',
    level: 12,
    avatarUrl: AVATARS.nate,
    isOnline: false,
  },
  {
    id: 'friend-dylan',
    name: 'Dylan',
    level: 11,
    avatarUrl: AVATARS.dylan,
    isOnline: false,
  },
];
