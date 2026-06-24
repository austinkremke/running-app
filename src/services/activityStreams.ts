import type { PostRunChartPoint } from '../mock';
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
