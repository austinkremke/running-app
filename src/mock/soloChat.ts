import type { TeamChatMessage } from './types';

const AVATARS = {
  austin:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  jordan:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
};

export const MOCK_SOLO_CHAT_MESSAGES: TeamChatMessage[] = [
  {
    id: 'solo-chat-1',
    authorName: 'Jordan',
    avatarUrl: AVATARS.jordan,
    body: 'Good luck out there. I’m not giving up this lead easily.',
    sentAt: '10:12 AM',
  },
  {
    id: 'solo-chat-2',
    authorName: 'Austin',
    avatarUrl: AVATARS.austin,
    body: 'Same. See you at the finish line.',
    sentAt: '10:14 AM',
    isCurrentUser: true,
  },
  {
    id: 'solo-chat-3',
    authorName: 'Jordan',
    avatarUrl: AVATARS.jordan,
    body: 'That 5.2 miler yesterday was solid. I’m going long tonight.',
    sentAt: '10:18 AM',
  },
];
