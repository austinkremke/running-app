import type { PostRunSummary, StatMetricKey } from '../mock';
import { metersToMiles } from './distanceService';
import type { OverallStatsRange } from './profileStatsService';
import { supabase } from './supabase';

export type { StatMetricKey };

export type TrendPoint = {
  bucketStart: string;
  label: string;
  value: number;
};

export type StatsTrendBundle = Record<StatMetricKey, TrendPoint[]>;

type Granularity = 'day' | 'week' | 'month';

const GRANULARITY_BY_RANGE: Record<OverallStatsRange, { granularity: Granularity; bucketCount: number }> = {
  week: { granularity: 'day', bucketCount: 7 },
  month: { granularity: 'week', bucketCount: 5 },
  year: { granularity: 'month', bucketCount: 12 },
  all: { granularity: 'month', bucketCount: 24 },
};

/** Human label shown above the current-period value in the stat detail drawer — the total across the whole selected range. */
export const CURRENT_PERIOD_LABEL: Record<OverallStatsRange, string> = {
  week: 'THIS WEEK',
  month: 'THIS MONTH',
  year: 'THIS YEAR',
  all: 'ALL TIME',
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function mondayOf(date: Date): Date {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function dayShortLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function monthShortLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function weekLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** Bucket boundaries (start of each period, oldest first) and a label per bucket for the chosen granularity. */
function buildBuckets(granularity: Granularity, count: number): { starts: Date[]; labels: string[] } {
  const now = new Date();

  if (granularity === 'day') {
    const todayStart = startOfDay(now);
    const starts = Array.from({ length: count }, (_, i) => addDays(todayStart, -(count - 1 - i)));
    return { starts, labels: starts.map(dayShortLabel) };
  }

  if (granularity === 'week') {
    const thisWeekStart = mondayOf(now);
    const starts = Array.from({ length: count }, (_, i) => addDays(thisWeekStart, -(count - 1 - i) * 7));
    return { starts, labels: starts.map(weekLabel) };
  }

  const thisMonthStart = startOfMonth(now);
  const starts = Array.from({ length: count }, (_, i) => addMonths(thisMonthStart, -(count - 1 - i)));
  return { starts, labels: starts.map(monthShortLabel) };
}

function bucketIndexFor(startedAt: Date, granularity: Granularity, bucketStarts: Date[]): number {
  const key = granularity === 'day' ? startOfDay(startedAt) : granularity === 'week' ? mondayOf(startedAt) : startOfMonth(startedAt);
  return bucketStarts.findIndex((start) => start.getTime() === key.getTime());
}

/**
 * Totals for every graphable Me-tab stat, bucketed to match the selected
 * Overall Stats range: Last Week → one point per day, Last Month → one point
 * per week, Last Year / All Time → one point per month.
 */
export async function fetchStatsTrend(userId: string, range: OverallStatsRange): Promise<StatsTrendBundle> {
  const { granularity, bucketCount } = GRANULARITY_BY_RANGE[range];
  const { starts, labels } = buildBuckets(granularity, bucketCount);

  const distance = new Array(bucketCount).fill(0);
  const calories = new Array(bucketCount).fill(0);
  const durationSeconds = new Array(bucketCount).fill(0);
  const elevation = new Array(bucketCount).fill(0);
  const runs = new Array(bucketCount).fill(0);

  if (supabase) {
    const { data, error } = await supabase
      .from('activities')
      .select('distance_meters, duration_seconds, summary_json, started_at')
      .eq('user_id', userId)
      .gte('started_at', starts[0].toISOString());

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      const startedAt = new Date(row.started_at);
      if (Number.isNaN(startedAt.getTime())) continue;

      const index = bucketIndexFor(startedAt, granularity, starts);
      if (index < 0) continue;

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

  function toPoints(values: number[], round: (value: number) => number): TrendPoint[] {
    return starts.map((start, index) => ({
      bucketStart: start.toISOString(),
      label: labels[index],
      value: round(values[index]),
    }));
  }

  const pace = distance.map((miles, index) => (miles > 0 ? durationSeconds[index] / miles : 0));

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
