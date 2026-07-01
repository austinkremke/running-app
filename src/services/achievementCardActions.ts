import { Linking } from 'react-native';

import { COMMUNITY_LINKS } from '../config/communityLinks';
import type { AchievementEventType, UnlockedAchievementPayload } from './achievementService';

const CARD_ACTION_ACHIEVEMENT_IDS = new Set([
  'rate_app',
  'notifications_on',
  'follow_instagram',
  'follow_tiktok',
]);

export function isAchievementCardActionable(achievementId: string, unlocked: boolean): boolean {
  return !unlocked && CARD_ACTION_ACHIEVEMENT_IDS.has(achievementId);
}

export async function performAchievementCardAction(
  achievementId: string,
  recordEvent: (
    eventType: AchievementEventType,
    metadata?: Record<string, unknown>,
  ) => Promise<UnlockedAchievementPayload[]>,
): Promise<UnlockedAchievementPayload[]> {
  switch (achievementId) {
    case 'rate_app':
      await Linking.openURL(COMMUNITY_LINKS.appStoreReview);
      return recordEvent('rate_app');
    case 'notifications_on':
      await Linking.openSettings();
      return recordEvent('notifications_on');
    case 'follow_instagram':
      await Linking.openURL(COMMUNITY_LINKS.instagram);
      return recordEvent('follow_instagram');
    case 'follow_tiktok':
      await Linking.openURL(COMMUNITY_LINKS.tiktok);
      return recordEvent('follow_tiktok');
    default:
      return [];
  }
}
