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

/** Lifetime totals across every synced activity — powers the Me tab overall stats. */
export async function fetchProfileOverallStats(userId: string): Promise<ProfileOverallStats> {
  if (!supabase) {
    return EMPTY_STATS;
  }

  const { data, error } = await supabase
    .from('activities')
    .select('distance_meters, duration_seconds, summary_json')
    .eq('user_id', userId);

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
