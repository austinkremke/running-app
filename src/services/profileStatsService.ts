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
