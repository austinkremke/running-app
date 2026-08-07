import type { PostRunChartPoint, PostRunChartTab } from '../mock';
import { buildPaceYLabels } from '../components/post-run/PostRunLineChart';

export type ChartAxisConfig = {
  yLabels: string[];
  yUnit: string;
  referenceValue?: number;
};

const CHART_TAB_LABELS: Record<PostRunChartTab, string> = {
  pace: 'PACE',
  elevation: 'ELEVATION',
  heartRate: 'HEART RATE',
};

export function chartTabLabel(tab: PostRunChartTab): string {
  return CHART_TAB_LABELS[tab];
}

const NICE_STEPS = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

/** Rounds a value range to "nice" axis labels (multiples of 10/20/25/50/...
 *  rather than whatever division of the raw min/max happens to produce, e.g.
 *  93/113/133/153) — picks the smallest nice step that still covers the
 *  range in about 2 steps (3 labels), then rounds the max up to that step so
 *  every label is a clean, consistent increment. Collapses to a single label
 *  when the data is genuinely flat (min === max) instead of repeating the
 *  same value — most often an imported run with only one real data point. */
function niceAxisLabels(minValue: number, maxValue: number): number[] {
  if (minValue === maxValue) {
    return [Math.round(maxValue)];
  }

  const range = maxValue - minValue;
  const target = range / 2;
  const step = NICE_STEPS.find((candidate) => candidate >= target) ?? NICE_STEPS[NICE_STEPS.length - 1];
  const niceMax = Math.ceil(maxValue / step) * step;
  const labels = [0, 1, 2].map((index) => niceMax - step * index);
  return labels.filter((value, index) => index === 0 || value !== labels[index - 1]);
}

/** Y-axis labels/unit/reference-line value for a chart tab, given its data
 *  and the run's reference lines (avg pace / avg HR). Shared between the
 *  full run-detail chart section and the compact feed-card chart slide so
 *  both read identically. */
export function buildChartAxisConfig(
  tab: PostRunChartTab,
  data: PostRunChartPoint[],
  referenceLines: Partial<Record<PostRunChartTab, number>>,
): ChartAxisConfig | null {
  if (data.length === 0) {
    return null;
  }

  const values = data.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (tab === 'pace') {
    return {
      yLabels: buildPaceYLabels(minValue, maxValue),
      yUnit: '/mi',
      referenceValue: referenceLines.pace,
    };
  }

  if (tab === 'elevation') {
    return {
      yLabels: niceAxisLabels(minValue, maxValue).map(String),
      yUnit: 'ft',
      referenceValue: undefined,
    };
  }

  return {
    yLabels: niceAxisLabels(minValue, maxValue).map(String),
    yUnit: 'bpm',
    referenceValue: referenceLines.heartRate,
  };
}
