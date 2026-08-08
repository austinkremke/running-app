import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const EXPO_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

export type NotificationCategory =
  | 'likes'
  | 'comments'
  | 'new_follower'
  | 'friend_challenge'
  | 'match_found'
  | 'match_reminders'
  | 'match_complete'
  | 'friend_activity';

export type NotificationPreferences = Record<NotificationCategory, boolean>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Requests OS push permission and registers this device's Expo token with the backend. Safe to call repeatedly — it's a no-op once already granted and registered. */
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    EXPO_PROJECT_ID ? { projectId: EXPO_PROJECT_ID } : undefined,
  );
  const token = tokenResponse.data;

  if (!supabase) {
    return;
  }

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const { error } = await supabase.rpc('upsert_push_token', {
    p_token: token,
    p_platform: platform,
  });

  if (error) {
    console.warn('Could not register push token', error);
  }
}

/** Removes this device's push token from the backend, e.g. on sign-out. */
export async function unregisterPushToken(): Promise<void> {
  if (!Device.isDevice || !supabase) {
    return;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      EXPO_PROJECT_ID ? { projectId: EXPO_PROJECT_ID } : undefined,
    );
    const { error } = await supabase.rpc('delete_push_token', { p_token: tokenResponse.data });
    if (error) {
      console.warn('Could not delete push token', error);
    }
  } catch (error) {
    console.warn('Could not resolve push token for deletion', error);
  }
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_my_notification_preferences');

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    likes: data.likes,
    comments: data.comments,
    new_follower: data.new_follower,
    friend_challenge: data.friend_challenge,
    match_found: data.match_found,
    match_reminders: data.match_reminders,
    match_complete: data.match_complete,
    friend_activity: data.friend_activity,
  };
}

export async function updateNotificationPreference(
  category: NotificationCategory,
  enabled: boolean,
): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc('update_notification_preference', {
    p_category: category,
    p_enabled: enabled,
  });

  if (error) {
    throw error;
  }
}
