import type { MileSplit, PostRunChartPoint } from '../mock';
import type { ActivityRecord } from '../types/activity';
import {
  buildChartSampleGrid,
  metersToMiles,
  milesToMeters,
} from '../utils/chartAxis';

const METERS_TO_FEET = 3.28084;

type InterpolatedSample = {
  elapsedSeconds: number;
  altitudeMeters: number | null;
  heartRateBpm: number | null;
};

function interpolateAtDistance(
  records: ActivityRecord[],
  distanceMeters: number,
): InterpolatedSample | null {
  if (records.length === 0) return null;

  if (distanceMeters <= 0) {
    return {
      elapsedSeconds: 0,
      altitudeMeters: records[0].altitudeMeters ?? null,
      heartRateBpm: records[0].heartRateBpm ?? null,
    };
  }

  const last = records[records.length - 1];
  if (distanceMeters >= last.distanceMeters) {
    return {
      elapsedSeconds: last.elapsedSeconds,
      altitudeMeters: last.altitudeMeters ?? null,
      heartRateBpm: last.heartRateBpm ?? null,
    };
  }

  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1];
    const current = records[index];

    if (distanceMeters > current.distanceMeters) continue;

    const spanMeters = current.distanceMeters - previous.distanceMeters;
    if (spanMeters <= 0) {
      return {
        elapsedSeconds: current.elapsedSeconds,
        altitudeMeters: current.altitudeMeters ?? null,
        heartRateBpm: current.heartRateBpm ?? null,
      };
    }

    const ratio = (distanceMeters - previous.distanceMeters) / spanMeters;
    const elapsedSeconds =
      previous.elapsedSeconds + ratio * (current.elapsedSeconds - previous.elapsedSeconds);

    let altitudeMeters: number | null = null;
    if (previous.altitudeMeters != null && current.altitudeMeters != null) {
      altitudeMeters =
        previous.altitudeMeters + ratio * (current.altitudeMeters - previous.altitudeMeters);
    } else {
      altitudeMeters = current.altitudeMeters ?? previous.altitudeMeters ?? null;
    }

    let heartRateBpm: number | null = null;
    if (previous.heartRateBpm != null && current.heartRateBpm != null) {
      heartRateBpm = previous.heartRateBpm + ratio * (current.heartRateBpm - previous.heartRateBpm);
    } else {
      heartRateBpm = current.heartRateBpm ?? previous.heartRateBpm ?? null;
    }

    return { elapsedSeconds, altitudeMeters, heartRateBpm };
  }

  return null;
}

function segmentPaceSecondsPerMile(
  records: ActivityRecord[],
  startMiles: number,
  endMiles: number,
): number | null {
  if (endMiles <= startMiles) return null;

  const startMeters = milesToMeters(startMiles);
  const endMeters = milesToMeters(endMiles);
  const start = interpolateAtDistance(records, startMeters);
  const end = interpolateAtDistance(records, endMeters);

  if (!start || !end) return null;

  const elapsedDelta = end.elapsedSeconds - start.elapsedSeconds;
  const distanceMiles = endMiles - startMiles;
  if (elapsedDelta <= 0 || distanceMiles <= 0) return null;

  return elapsedDelta / distanceMiles;
}

export type DistanceMilestoneKey =
  | 'half_mile'
  | 'one_k'
  | 'mile'
  | 'five_k'
  | 'five_mile'
  | 'ten_k'
  | 'half_marathon'
  | 'marathon';

export const DISTANCE_MILESTONES: { key: DistanceMilestoneKey; label: string; meters: number }[] = [
  { key: 'half_mile', label: '1/2 Mile', meters: 804.672 },
  { key: 'one_k', label: '1K', meters: 1000 },
  { key: 'mile', label: '1 Mile', meters: 1609.344 },
  { key: 'five_k', label: '5K', meters: 5000 },
  { key: 'five_mile', label: '5 Mile', meters: 8046.72 },
  { key: 'ten_k', label: '10K', meters: 10000 },
  { key: 'half_marathon', label: 'Half Marathon', meters: 21097.5 },
  { key: 'marathon', label: 'Marathon', meters: 42195 },
];

/**
 * Fastest elapsed time for any contiguous window of `targetMeters` anywhere in
 * the track (a "best effort," not just from the start) — e.g. the fastest 1/2
 * mile embedded in a slower overall run. O(n) two-pointer since cumulative
 * distance is monotonic.
 */
function bestSplitForDistance(records: ActivityRecord[], targetMeters: number): number | null {
  const n = records.length;
  if (n < 2) return null;
  const total = records[n - 1].distanceMeters;
  if (total < targetMeters) return null;

  let best = Infinity;
  let j = 1;

  for (let i = 0; i < n; i += 1) {
    const startDist = records[i].distanceMeters;
    const startTime = records[i].elapsedSeconds;
    const endDist = startDist + targetMeters;
    if (endDist > total) break;

    if (j < i + 1) j = i + 1;
    while (j < n - 1 && records[j].distanceMeters < endDist) j += 1;

    const prev = records[j - 1];
    const curr = records[j];
    let endTime: number;
    if (curr.distanceMeters <= endDist) {
      endTime = curr.elapsedSeconds;
    } else {
      const span = curr.distanceMeters - prev.distanceMeters;
      const ratio = span > 0 ? (endDist - prev.distanceMeters) / span : 0;
      endTime = prev.elapsedSeconds + ratio * (curr.elapsedSeconds - prev.elapsedSeconds);
    }

    const windowSeconds = endTime - startTime;
    if (windowSeconds < best) best = windowSeconds;
  }

  return best === Infinity ? null : Math.round(best);
}

/**
 * For each milestone distance this run's track actually covers, the fastest
 * embedded "best effort" time for that exact distance anywhere in the run —
 * not just from the start. A run must cover at least the full milestone
 * distance to qualify (an extreme first-ever run past marathon distance
 * qualifies for every shorter milestone too, computed independently).
 */
export function computeDistanceMilestoneSplits(
  records: ActivityRecord[],
): { distanceKey: DistanceMilestoneKey; splitSeconds: number }[] {
  if (records.length < 2) return [];
  const totalMeters = records[records.length - 1]?.distanceMeters ?? 0;

  return DISTANCE_MILESTONES.filter((milestone) => totalMeters >= milestone.meters)
    .map((milestone) => {
      const splitSeconds = bestSplitForDistance(records, milestone.meters);
      return splitSeconds != null ? { distanceKey: milestone.key, splitSeconds } : null;
    })
    .filter((entry): entry is { distanceKey: DistanceMilestoneKey; splitSeconds: number } => entry != null);
}

/**
 * Per-mile splits from the raw record track. Each full mile plus a trailing
 * partial mile; pace is normalized to seconds-per-mile so partial miles compare
 * fairly. Returns [] for runs under the first split boundary or without a track.
 */
export function computeMileSplits(records: ActivityRecord[]): MileSplit[] {
  const totalMiles = metersToMiles(records[records.length - 1]?.distanceMeters ?? 0);
  if (totalMiles <= 0 || records.length < 2) return [];

  const splits: MileSplit[] = [];
  const fullMiles = Math.floor(totalMiles);

  for (let mile = 0; mile < fullMiles; mile += 1) {
    const pace = segmentPaceSecondsPerMile(records, mile, mile + 1);
    if (pace == null) continue;
    splits.push({
      mile: mile + 1,
      distanceMiles: 1,
      paceSeconds: Math.round(pace),
      elevationChangeFt: elevationChangeFeet(records, mile, mile + 1),
      isPartial: false,
    });
  }

  const remainder = totalMiles - fullMiles;
  if (remainder >= 0.01) {
    const pace = segmentPaceSecondsPerMile(records, fullMiles, totalMiles);
    if (pace != null) {
      splits.push({
        mile: fullMiles + 1,
        distanceMiles: Number(remainder.toFixed(2)),
        paceSeconds: Math.round(pace),
        elevationChangeFt: elevationChangeFeet(records, fullMiles, totalMiles),
        isPartial: true,
      });
    }
  }

  return splits;
}

function elevationChangeFeet(
  records: ActivityRecord[],
  startMiles: number,
  endMiles: number,
): number {
  const start = interpolateAtDistance(records, milesToMeters(startMiles));
  const end = interpolateAtDistance(records, milesToMeters(endMiles));
  if (start?.altitudeMeters == null || end?.altitudeMeters == null) return 0;
  return Math.round((end.altitudeMeters - start.altitudeMeters) * METERS_TO_FEET);
}

export function buildPaceChartFromRecords(records: ActivityRecord[]): PostRunChartPoint[] {
  const totalMiles = metersToMiles(records[records.length - 1]?.distanceMeters ?? 0);
  if (totalMiles <= 0 || records.length < 2) return [];

  const grid = buildChartSampleGrid(totalMiles);
  const chart: PostRunChartPoint[] = [];

  for (let index = 0; index < grid.length; index += 1) {
    const endMiles = grid[index];
    const startMiles = index === 0 ? 0 : grid[index - 1];

    const pace = segmentPaceSecondsPerMile(records, startMiles, endMiles);
    if (pace == null) continue;

    chart.push({
      distanceMiles: Number(endMiles.toFixed(4)),
      value: Math.round(pace),
    });
  }

  return chart;
}

export function buildHeartRateChartFromRecords(records: ActivityRecord[]): PostRunChartPoint[] {
  const hasHeartRate = records.some((record) => record.heartRateBpm != null);
  if (!hasHeartRate) return [];

  const totalMiles = metersToMiles(records[records.length - 1]?.distanceMeters ?? 0);
  if (totalMiles <= 0) return [];

  const grid = buildChartSampleGrid(totalMiles);

  return grid
    .map((distanceMiles) => {
      const sample = interpolateAtDistance(records, milesToMeters(distanceMiles));
      if (sample?.heartRateBpm == null) return null;

      return {
        distanceMiles: Number(distanceMiles.toFixed(4)),
        value: Math.round(sample.heartRateBpm),
      };
    })
    .filter((point): point is PostRunChartPoint => point != null);
}

export function buildElevationChartFromRecords(records: ActivityRecord[]): PostRunChartPoint[] {
  const hasAltitude = records.some((record) => record.altitudeMeters != null);
  if (!hasAltitude) return [];

  const totalMiles = metersToMiles(records[records.length - 1]?.distanceMeters ?? 0);
  if (totalMiles <= 0) return [];

  const grid = buildChartSampleGrid(totalMiles);

  return grid
    .map((distanceMiles) => {
      const sample = interpolateAtDistance(records, milesToMeters(distanceMiles));
      if (sample?.altitudeMeters == null) return null;

      return {
        distanceMiles: Number(distanceMiles.toFixed(4)),
        value: Math.round(sample.altitudeMeters * METERS_TO_FEET),
      };
    })
    .filter((point): point is PostRunChartPoint => point != null);
}
