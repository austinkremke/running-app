import type { TeamChatMessage } from './types';

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
};

export const MOCK_TEAM_CHAT_MESSAGES: TeamChatMessage[] = [
  {
    id: 'chat-1',
    authorName: 'Tyler',
    avatarUrl: AVATARS.tyler,
    body: 'Nice pace on that last run Austin 🔥',
    sentAt: '2:18 PM',
  },
  {
    id: 'chat-2',
    authorName: 'Austin',
    avatarUrl: AVATARS.austin,
    body: 'Thanks! Trying to close the gap before tonight.',
    sentAt: '2:21 PM',
    isCurrentUser: true,
  },
  {
    id: 'chat-3',
    authorName: 'Chris',
    avatarUrl: AVATARS.chris,
    body: 'I can hop on a run in about 30 if anyone wants to stack points.',
    sentAt: '2:24 PM',
  },
  {
    id: 'chat-4',
    authorName: 'Jake',
    avatarUrl: AVATARS.jake,
    body: "I'm in. Let's push the team total over 1,300.",
    sentAt: '2:26 PM',
  },
  {
    id: 'chat-5',
    authorName: 'Ryan',
    avatarUrl: AVATARS.ryan,
    body: 'Pacers are closing fast. We need a big evening.',
    sentAt: '2:31 PM',
  },
  {
    id: 'chat-6',
    authorName: 'Austin',
    avatarUrl: AVATARS.austin,
    body: 'On it. Heading out now.',
    sentAt: '2:33 PM',
    isCurrentUser: true,
  },
];
