import type { PostRunSummary, StatMetricKey } from '../mock';
import { metersToMiles } from './distanceService';
import { supabase } from './supabase';

export type { StatMetricKey };

export type WeeklyPoint = {
  weekStart: string;
  /** Short month label (e.g. "JUL") shown at the first week of a new month; empty otherwise. */
  monthLabel: string;
  value: number;
};

export type WeeklyStatsBundle = Record<StatMetricKey, WeeklyPoint[]>;

const DEFAULT_WEEKS = 16;

function mondayOf(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function monthShortLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

/**
 * Weekly totals (Monday-start) for every graphable Me-tab stat, over the
 * trailing `weeks` weeks including the current (possibly partial) week.
 * One query powers all metrics so opening any stat's detail view is cheap.
 */
export async function fetchWeeklyStatsBundle(
  userId: string,
  weeks = DEFAULT_WEEKS,
): Promise<WeeklyStatsBundle> {
  const thisWeekStart = mondayOf(new Date());
  const rangeStart = addDays(thisWeekStart, -(weeks - 1) * 7);

  const weekBuckets = Array.from({ length: weeks }, (_, index) => addDays(rangeStart, index * 7));

  const distance = new Array(weeks).fill(0);
  const calories = new Array(weeks).fill(0);
  const durationSeconds = new Array(weeks).fill(0);
  const elevation = new Array(weeks).fill(0);
  const runs = new Array(weeks).fill(0);

  if (supabase) {
    const { data, error } = await supabase
      .from('activities')
      .select('distance_meters, duration_seconds, summary_json, started_at')
      .eq('user_id', userId)
      .gte('started_at', rangeStart.toISOString());

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      const startedAt = new Date(row.started_at);
      if (Number.isNaN(startedAt.getTime())) continue;

      const weekStart = mondayOf(startedAt);
      const index = Math.round((weekStart.getTime() - rangeStart.getTime()) / (7 * 86400000));
      if (index < 0 || index >= weeks) continue;

      const summary =
        row.summary_json && typeof row.summary_json === 'object'
          ? (row.summary_json as unknown as PostRunSummary)
          : null;

      distance[index] += metersToMiles(row.distance_meters ?? 0);
      durationSeconds[index] += row.duration_seconds ?? 0;
      calories[index] += summary?.calories ?? 0;
      elevation[index] += summary?.elevationGain ?? 0;
      runs[index] += 1;
    }
  }

  function toPoints(values: number[], round: (value: number) => number): WeeklyPoint[] {
    let lastMonth = -1;
    return weekBuckets.map((weekStart, index) => {
      const month = weekStart.getMonth();
      const monthLabel = month !== lastMonth ? monthShortLabel(weekStart) : '';
      lastMonth = month;
      return {
        weekStart: weekStart.toISOString(),
        monthLabel,
        value: round(values[index]),
      };
    });
  }

  const pace = distance.map((miles, index) =>
    miles > 0 ? durationSeconds[index] / miles : 0,
  );

  return {
    distance: toPoints(distance, (value) => Number(value.toFixed(2))),
    calories: toPoints(calories, Math.round),
    time: toPoints(
      durationSeconds.map((seconds) => seconds / 60),
      Math.round,
    ),
    elevation: toPoints(elevation, Math.round),
    runs: toPoints(runs, Math.round),
    pace: toPoints(pace, Math.round),
  };
}
