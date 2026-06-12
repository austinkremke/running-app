import type { GpsPoint } from '../maps/types';
import type { PostRunChartPoint, PostRunSummary } from './types';

const TOTAL_MILES = 8.43;
const CHART_SAMPLE_COUNT = 168;

function buildChartSeries(getValue: (t: number) => number): PostRunChartPoint[] {
  const points: PostRunChartPoint[] = [];

  for (let index = 0; index <= CHART_SAMPLE_COUNT; index += 1) {
    const t = index / CHART_SAMPLE_COUNT;
    points.push({
      distanceMiles: Number((TOTAL_MILES * t).toFixed(3)),
      value: getValue(t),
    });
  }

  return points;
}

function buildRoutePoints(): GpsPoint[] {
  const startLat = 37.7749;
  const startLng = -122.4194;
  const points: GpsPoint[] = [];

  for (let index = 0; index <= 24; index += 1) {
    const t = index / 24;
    points.push({
      latitude: startLat + Math.sin(t * Math.PI * 1.4) * 0.018 + t * 0.012,
      longitude: startLng + Math.cos(t * Math.PI * 1.1) * 0.022 + t * 0.008,
      timestamp: new Date(Date.now() - (24 - index) * 60_000).toISOString(),
    });
  }

  return points;
}

function buildPaceSeries(): PostRunChartPoint[] {
  const baseSeconds = 7 * 60 + 22;

  return buildChartSeries((t) => {
    const wave =
      Math.sin(t * Math.PI * 9) * 48 +
      Math.cos(t * Math.PI * 4) * 28 +
      Math.sin(t * Math.PI * 22) * 12;
    const hill = t > 0.65 ? (t - 0.65) * 220 : 0;

    return baseSeconds + wave + hill;
  });
}

function buildElevationSeries(): PostRunChartPoint[] {
  return buildChartSeries((t) => {
    const base =
      120 +
      Math.sin(t * Math.PI * 5) * 90 +
      Math.sin(t * Math.PI * 13) * 24 +
      Math.max(0, t - 0.45) * 420;

    return Math.round(base);
  });
}

function buildHeartRateSeries(): PostRunChartPoint[] {
  return buildChartSeries((t) => {
    const warmup = Math.min(t * 120, 24);
    const drift = t > 0.5 ? (t - 0.5) * 48 : 0;
    const wave = Math.sin(t * Math.PI * 8) * 8 + Math.sin(t * Math.PI * 19) * 4;

    return Math.round(132 + warmup + drift + wave);
  });
}

export const MOCK_POST_RUN_ROUTE = buildRoutePoints();

export const MOCK_POST_RUN: PostRunSummary = {
  completedAtLabel: 'May 12, 2024 at 7:32 AM',
  distanceMiles: TOTAL_MILES,
  duration: '1:02:18',
  durationUnit: 'hr',
  avgPace: '7:22',
  avgPaceUnit: '/mi',
  calories: 812,
  caloriesUnit: 'cal',
  avgHeartRate: 156,
  avgHeartRateUnit: 'bpm',
  elevationGain: 472,
  elevationGainUnit: 'ft',
  weatherTempF: 68,
  photos: [
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop',
  ],
  chartData: {
    pace: buildPaceSeries(),
    elevation: buildElevationSeries(),
    heartRate: buildHeartRateSeries(),
  },
  chartReferenceLines: {
    pace: 7 * 60 + 0,
    heartRate: 156,
  },
};
