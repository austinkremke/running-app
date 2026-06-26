import { MIN_DISTANCE_MILES } from './xpRewards';

const DEV_MIN_DISTANCE_MILES = 0.01;

export function xpMinDistanceMiles(userId: string | null | undefined): number {
  if (!__DEV__ || !userId) {
    return MIN_DISTANCE_MILES;
  }

  const devUserId = process.env.EXPO_PUBLIC_DEV_XP_USER_ID?.trim();
  if (!devUserId || devUserId !== userId) {
    return MIN_DISTANCE_MILES;
  }

  return DEV_MIN_DISTANCE_MILES;
}

export function isDevXpBypassUser(userId: string | null | undefined): boolean {
  return xpMinDistanceMiles(userId) < MIN_DISTANCE_MILES;
}
