import type { Achievement, AchievementVariant } from '../mock';
import type { Json, Tables } from '../types/database';
import { supabase } from './supabase';

export type AchievementDefinitionRow = Tables<'achievement_definitions'>;
export type UserAchievementRow = Tables<'user_achievements'>;

export type UnlockedAchievementPayload = {
  id: string;
  display_name: string;
  description: string;
  category: string;
  tier: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
};

export type AchievementListItem = Achievement & {
  unlocked: boolean;
  description: string;
  category: string;
  xpReward: number;
};

const TIER_VARIANT: Record<string, AchievementVariant> = {
  bronze: 'purple',
  silver: 'purple',
  gold: 'gold',
  elite: 'lime',
};

function formatUnlockDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function mapDefinitionToAchievement(
  definition: AchievementDefinitionRow,
  unlockedAt?: string | null,
): AchievementListItem {
  return {
    id: definition.id,
    label: definition.display_name.toUpperCase(),
    date: unlockedAt ? formatUnlockDate(unlockedAt) : 'Locked',
    icon: definition.icon,
    variant: TIER_VARIANT[definition.tier] ?? 'purple',
    unlocked: Boolean(unlockedAt),
    description: definition.description,
    category: definition.category,
    xpReward: definition.xp_reward,
  };
}

export async function fetchAchievementDefinitions(): Promise<AchievementDefinitionRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchAllAchievementDefinitions(): Promise<AchievementDefinitionRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchUserAchievements(userId: string): Promise<UserAchievementRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function evaluateAchievements(): Promise<UnlockedAchievementPayload[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('evaluate_achievements');

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data as UnlockedAchievementPayload[];
}

export type AchievementEventType =
  | 'share_feed_post'
  | 'rate_app'
  | 'notifications_on'
  | 'follow_instagram'
  | 'follow_tiktok';

export async function recordAchievementEvent(
  eventType: AchievementEventType,
  metadata: Record<string, unknown> = {},
): Promise<UnlockedAchievementPayload[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('record_achievement_event', {
    p_event_type: eventType,
    p_metadata: metadata as Json,
  });

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data as UnlockedAchievementPayload[];
}

export async function loadAchievementList(userId: string | null): Promise<AchievementListItem[]> {
  const [definitions, unlocks] = await Promise.all([
    fetchAllAchievementDefinitions(),
    userId ? fetchUserAchievements(userId) : Promise.resolve([]),
  ]);

  const unlockById = new Map(unlocks.map((row) => [row.achievement_id, row.unlocked_at]));

  return definitions
    .filter((definition) => definition.is_active)
    .map((definition) => mapDefinitionToAchievement(definition, unlockById.get(definition.id)));
}

export async function loadUnlockedAchievements(userId: string): Promise<AchievementListItem[]> {
  const items = await loadAchievementList(userId);
  return items.filter((item) => item.unlocked);
}
