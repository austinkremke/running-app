import type { MileSplit, PostRunChartPoint } from '../mock';
import type { ActivityRecord } from '../types/activity';
import {
  buildDistanceGrid,
  getDistanceDecimals,
  metersToMiles,
  milesToMeters,
} from '../utils/chartAxis';

const METERS_TO_FEET = 3.28084;

type InterpolatedSample = {
  elapsedSeconds: number;
  altitudeMeters: number | null;
};

function interpolateAtDistance(
  records: ActivityRecord[],
  distanceMeters: number,
): InterpolatedSample | null {
  if (records.length === 0) return null;

  if (distanceMeters <= 0) {
    return { elapsedSeconds: 0, altitudeMeters: records[0].altitudeMeters ?? null };
  }

  const last = records[records.length - 1];
  if (distanceMeters >= last.distanceMeters) {
    return {
      elapsedSeconds: last.elapsedSeconds,
      altitudeMeters: last.altitudeMeters ?? null,
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

    return { elapsedSeconds, altitudeMeters };
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

  const grid = buildDistanceGrid(totalMiles);
  const decimals = getDistanceDecimals(totalMiles);
  const chart: PostRunChartPoint[] = [];

  for (let index = 0; index < grid.length; index += 1) {
    const endMiles = grid[index];
    const startMiles = index === 0 ? 0 : grid[index - 1];
    const segmentEnd = index === 0 ? grid[Math.min(1, grid.length - 1)] : endMiles;
    const segmentStart = index === 0 ? 0 : startMiles;

    const pace = segmentPaceSecondsPerMile(records, segmentStart, segmentEnd);
    if (pace == null) continue;

    chart.push({
      distanceMiles: Number(endMiles.toFixed(decimals)),
      value: pace,
    });
  }

  return chart;
}

export function buildElevationChartFromRecords(records: ActivityRecord[]): PostRunChartPoint[] {
  const hasAltitude = records.some((record) => record.altitudeMeters != null);
  if (!hasAltitude) return [];

  const totalMiles = metersToMiles(records[records.length - 1]?.distanceMeters ?? 0);
  if (totalMiles <= 0) return [];

  const grid = buildDistanceGrid(totalMiles);
  const decimals = getDistanceDecimals(totalMiles);

  return grid
    .map((distanceMiles) => {
      const sample = interpolateAtDistance(records, milesToMeters(distanceMiles));
      if (sample?.altitudeMeters == null) return null;

      return {
        distanceMiles: Number(distanceMiles.toFixed(decimals)),
        value: Math.round(sample.altitudeMeters * METERS_TO_FEET),
      };
    })
    .filter((point): point is PostRunChartPoint => point != null);
}
