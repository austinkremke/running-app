import type { PostRunSummary } from '../mock';
import type { ActivityRecord, ActivitySession } from '../types/activity';
import {
  formatDurationParts,
  formatPace,
  metersToMiles,
} from './distanceService';
import {
  averagePaceSecondsPerMile,
  elevationGainFeet,
  estimateCalories,
  totalDistanceMeters,
  totalElapsedSeconds,
} from './activityMetrics';
import {
  buildElevationChartFromRecords,
  buildPaceChartFromRecords,
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

  return {
    completedAtLabel: formatCompletedAtLabel(endedAt),
    distanceMiles: Number(distanceMiles.toFixed(2)),
    duration: duration.value,
    durationUnit: duration.unit,
    avgPace: formatPace(avgPaceSeconds),
    avgPaceUnit: '/mi',
    calories: estimateCalories(distanceMiles),
    caloriesUnit: 'cal',
    avgHeartRate: 0,
    avgHeartRateUnit: 'bpm',
    elevationGain: elevationGainFeet(records),
    elevationGainUnit: 'ft',
    photos: [],
    chartData: {
      pace: paceChart,
      elevation: elevationChart,
      heartRate: [],
    },
    chartReferenceLines: {
      pace: avgPaceSeconds > 0 ? avgPaceSeconds : undefined,
    },
  };
}
