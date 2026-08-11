import type { PostRunSummary } from '../mock';
import { metersToMiles } from './distanceService';
import { supabase } from './supabase';

export type ProfileOverallStats = {
  totalDistanceMiles: number;
  totalDurationSeconds: number;
  totalCalories: number;
  totalElevationGainFt: number;
  totalRuns: number;
  avgPaceSecondsPerMile: number;
};

const EMPTY_STATS: ProfileOverallStats = {
  totalDistanceMiles: 0,
  totalDurationSeconds: 0,
  totalCalories: 0,
  totalElevationGainFt: 0,
  totalRuns: 0,
  avgPaceSecondsPerMile: 0,
};

export type ProfileHeaderCounts = {
  followers: number;
  following: number;
  activities: number;
};

const EMPTY_HEADER_COUNTS: ProfileHeaderCounts = {
  followers: 0,
  following: 0,
  activities: 0,
};

/** Lifetime follower / following / activity totals for the Me header social row. */
export async function fetchProfileHeaderCounts(userId: string): Promise<ProfileHeaderCounts> {
  if (!supabase) {
    return EMPTY_HEADER_COUNTS;
  }

  const [followers, following, activities] = await Promise.all([
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('followed_id', userId),
    supabase
      .from('follows')
      .select('followed_id', { count: 'exact', head: true })
      .eq('follower_id', userId),
    supabase.from('activities').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  if (activities.error) throw activities.error;

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    activities: activities.count ?? 0,
  };
}

export type OverallStatsRange = 'all' | 'week' | 'month' | 'year';

/** Start-of-range cutoff for a rolling window ending now; `null` for all-time (no filter). */
export function rangeSinceDate(range: OverallStatsRange): Date | null {
  if (range === 'all') return null;

  const since = new Date();
  if (range === 'week') since.setDate(since.getDate() - 7);
  else if (range === 'month') since.setDate(since.getDate() - 30);
  else since.setDate(since.getDate() - 365);
  return since;
}

/** Totals across synced activities — lifetime by default, or since a given cutoff for the Me tab range tabs. */
export async function fetchProfileOverallStats(
  userId: string,
  since?: Date | null,
): Promise<ProfileOverallStats> {
  if (!supabase) {
    return EMPTY_STATS;
  }

  let query = supabase
    .from('activities')
    .select('distance_meters, duration_seconds, summary_json')
    .eq('user_id', userId);

  if (since) {
    query = query.gte('started_at', since.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  let totalCalories = 0;
  let totalElevationGainFt = 0;

  for (const row of rows) {
    totalDistanceMeters += row.distance_meters ?? 0;
    totalDurationSeconds += row.duration_seconds ?? 0;

    const summary =
      row.summary_json && typeof row.summary_json === 'object'
        ? (row.summary_json as unknown as PostRunSummary)
        : null;

    totalCalories += summary?.calories ?? 0;
    totalElevationGainFt += summary?.elevationGain ?? 0;
  }

  const totalDistanceMiles = metersToMiles(totalDistanceMeters);

  return {
    totalDistanceMiles,
    totalDurationSeconds,
    totalCalories: Math.round(totalCalories),
    totalElevationGainFt: Math.round(totalElevationGainFt),
    totalRuns: rows.length,
    avgPaceSecondsPerMile: totalDistanceMiles > 0 ? totalDurationSeconds / totalDistanceMiles : 0,
  };
}
