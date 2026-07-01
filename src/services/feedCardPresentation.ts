import type { PostRunChartPoint, PostRunSummary } from '../mock';
import { formatPace } from './distanceService';

export type RunPaceHighlight = {
  label: string;
  value: string;
  detail: string;
};

function fastestPacePoint(points: PostRunChartPoint[]): PostRunChartPoint | null {
  let fastest: PostRunChartPoint | null = null;

  for (const point of points) {
    if (point.value <= 0) {
      continue;
    }

    if (!fastest || point.value < fastest.value) {
      fastest = point;
    }
  }

  return fastest;
}

export function paceHighlightFromSummary(summary: PostRunSummary | null): RunPaceHighlight | null {
  if (!summary) {
    return null;
  }

  const fastest = fastestPacePoint(summary.chartData.pace ?? []);
  if (!fastest) {
    return null;
  }

  return {
    label: 'Fastest split',
    value: `${formatPace(fastest.value)} /mi`,
    detail: `at ${fastest.distanceMiles.toFixed(1)} mi`,
  };
}

export function photoUrlFromPost(
  postPhotoUrl: string | null | undefined,
  summary: PostRunSummary | null,
): string | undefined {
  if (postPhotoUrl) {
    return postPhotoUrl;
  }

  const summaryPhoto = summary?.photos?.[0];
  return summaryPhoto || undefined;
}
