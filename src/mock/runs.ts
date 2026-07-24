import type { FeedTab, Run } from './types';
import type { GpsPoint } from '../maps/types';
import { MOCK_POST_RUN_ROUTE } from './postRun';

function offsetRoute(route: GpsPoint[], latOffset: number, lngOffset: number): GpsPoint[] {
  return route.map((point) => ({
    ...point,
    latitude: point.latitude + latOffset,
    longitude: point.longitude + lngOffset,
  }));
}

export const MOCK_RUNS: Run[] = [
  {
    id: 'run-1',
    activityId: 'activity-run-1',
    user: {
      id: 'user-austin',
      name: 'Austin Kremke',
      level: 24,
      teamName: 'Road Warriors',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
    title: 'What a great run!',
    description: 'Really had to push myself those last 2 miles.',
    location: 'Omaha, Nebraska',
    postedAt: '2 hours ago',
    stats: {
      distanceMiles: 5.73,
      pacePerMile: '7:28',
      duration: '45:21',
    },
    routePoints: offsetRoute(MOCK_POST_RUN_ROUTE, 0.004, -0.006),
    photoUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=400&fit=crop',
    likes: 42,
    comments: 6,
    likedByMe: false,
    feedTabs: ['community', 'friends', 'team'],
  },
  {
    id: 'run-2',
    activityId: 'activity-run-2',
    user: {
      id: 'user-sarah',
      name: 'Sarah Adams',
      level: 18,
      teamName: 'Road Warriors',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    },
    title: 'Early morning miles hit different.',
    description: 'Nothing beats sunrise miles with the crew.',
    location: 'Omaha, Nebraska',
    postedAt: '3 hours ago',
    stats: {
      distanceMiles: 4.2,
      pacePerMile: '8:05',
      duration: '33:54',
    },
    routePoints: offsetRoute(MOCK_POST_RUN_ROUTE, -0.008, 0.012),
    photoUrl:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&h=400&fit=crop',
    likes: 28,
    comments: 4,
    likedByMe: false,
    feedTabs: ['community', 'friends'],
  },
  {
    id: 'run-3',
    activityId: 'activity-run-3',
    user: {
      id: 'user-jake',
      name: 'Jake Thompson',
      level: 15,
      teamName: 'Midnight Milers',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    },
    title: 'New PR on the river trail!',
    description: 'Legs felt strong the whole way.',
    location: 'Council Bluffs, Iowa',
    postedAt: '5 hours ago',
    stats: {
      distanceMiles: 6.1,
      pacePerMile: '7:12',
      duration: '43:58',
    },
    routePoints: offsetRoute(MOCK_POST_RUN_ROUTE, 0.012, 0.004),
    photoUrl:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=400&fit=crop',
    likes: 51,
    comments: 9,
    likedByMe: false,
    feedTabs: ['community', 'team'],
  },
];

export function getRunsForTab(tab: FeedTab): Run[] {
  return MOCK_RUNS.filter((run) => run.feedTabs.includes(tab));
}
