import type { PostRunSummary } from '../mock';
import type { ActivityRecord, ActivitySession } from '../types/activity';
import {
  formatDurationParts,
  formatPace,
  metersToMiles,
} from './distanceService';
import {
  averageHeartRateBpm,
  averagePaceSecondsPerMile,
  elevationGainFeet,
  estimateCalories,
  totalDistanceMeters,
  totalElapsedSeconds,
} from './activityMetrics';
import {
  buildElevationChartFromRecords,
  buildHeartRateChartFromRecords,
  buildPaceChartFromRecords,
  computeMileSplits,
} from './activityStreams';

function formatCompletedAtLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function buildPostRunSummary(
  session: ActivitySession,
  records: ActivityRecord[],
  endedAt: string,
): PostRunSummary {
  const distanceMeters = totalDistanceMeters(records);
  const distanceMiles = metersToMiles(distanceMeters);
  const durationSeconds = totalElapsedSeconds(records);
  const avgPaceSeconds = averagePaceSecondsPerMile(records);
  const duration = formatDurationParts(durationSeconds);
  const paceChart = buildPaceChartFromRecords(records);
  const elevationChart = buildElevationChartFromRecords(records);
  const heartRateChart = buildHeartRateChartFromRecords(records);

  return {
    completedAtLabel: formatCompletedAtLabel(endedAt),
    distanceMiles: Number(distanceMiles.toFixed(2)),
    duration: duration.value,
    durationUnit: duration.unit,
    avgPace: formatPace(avgPaceSeconds),
    avgPaceUnit: '/mi',
    calories: estimateCalories(distanceMiles),
    caloriesUnit: 'cal',
    avgHeartRate: averageHeartRateBpm(records),
    avgHeartRateUnit: 'bpm',
    elevationGain: elevationGainFeet(records),
    elevationGainUnit: 'ft',
    photos: [],
    chartData: {
      pace: paceChart,
      elevation: elevationChart,
      heartRate: heartRateChart,
    },
    chartReferenceLines: {
      pace: avgPaceSeconds > 0 ? avgPaceSeconds : undefined,
    },
    splits: computeMileSplits(records),
  };
}
