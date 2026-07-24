import { DISTANCE_MILESTONES, type DistanceMilestoneKey } from './activityStreams';
import { supabase } from './supabase';

export type DistanceBadge = {
  distanceKey: DistanceMilestoneKey;
  rank: 1 | 2 | 3;
};

export type PersonalRecord = {
  distanceKey: DistanceMilestoneKey;
  rank: 1 | 2 | 3;
  splitSeconds: number;
  activityId: string;
  achievedAt: string;
};

export type AllTimeBest = {
  activityId: string;
  splitSeconds: number;
  achievedAt: string;
};

export function distanceMilestoneLabel(key: DistanceMilestoneKey): string {
  return DISTANCE_MILESTONES.find((milestone) => milestone.key === key)?.label ?? key;
}

/** Records this run's qualifying milestone splits (called once per "Lock in your run"). */
export async function recordDistanceSplits(
  activityId: string,
  splits: { distanceKey: DistanceMilestoneKey; splitSeconds: number }[],
): Promise<void> {
  if (!supabase || splits.length === 0) return;
  const client = supabase;

  await Promise.all(
    splits.map(async ({ distanceKey, splitSeconds }) => {
      const { error } = await client.rpc('upsert_distance_record', {
        p_activity_id: activityId,
        p_distance_key: distanceKey,
        p_split_seconds: splitSeconds,
      });
      if (error) throw error;
    }),
  );
}

/** Current gold/silver/bronze badges for a set of activities, keyed by activity id. */
export async function fetchDistanceBadges(
  activityIds: string[],
): Promise<Record<string, DistanceBadge[]>> {
  if (!supabase || activityIds.length === 0) return {};

  const { data, error } = await supabase.rpc('get_distance_badges', { p_activity_ids: activityIds });
  if (error) throw error;

  const badgesByActivity: Record<string, DistanceBadge[]> = {};

  for (const row of data ?? []) {
    const list = badgesByActivity[row.activity_id] ?? [];
    list.push({ distanceKey: row.distance_key as DistanceMilestoneKey, rank: row.rnk as 1 | 2 | 3 });
    badgesByActivity[row.activity_id] = list;
  }

  return badgesByActivity;
}

/** Top-3 personal records per distance for a user, for the Me page. */
export async function fetchPersonalRecords(userId?: string): Promise<PersonalRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc(
    'get_personal_records',
    userId ? { p_user_id: userId } : undefined,
  );
  if (error) throw error;

  return (data ?? []).map((row) => ({
    distanceKey: row.distance_key as DistanceMilestoneKey,
    rank: row.rnk as 1 | 2 | 3,
    splitSeconds: row.split_seconds,
    activityId: row.activity_id,
    achievedAt: row.achieved_at,
  }));
}

/**
 * The chronological PR progression for one distance — every run that set a
 * new all-time best at the time it happened, oldest first, ending at the
 * current record. Premium ("All-Time Personal Bests" screen).
 */
export async function fetchAllTimeBests(
  distanceKey: DistanceMilestoneKey,
  userId?: string,
): Promise<AllTimeBest[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_all_time_bests', {
    ...(userId ? { p_user_id: userId } : {}),
    p_distance_key: distanceKey,
  });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    activityId: row.activity_id,
    splitSeconds: row.split_seconds,
    achievedAt: row.achieved_at,
  }));
}
