const METERS_PER_MILE = 1609.344;

export type DistanceAxisTick = {
  id: string;
  value: number;
  label: string;
};

export function getDistanceDecimals(maxMiles: number): number {
  if (maxMiles < 0.1) return 3;
  if (maxMiles < 1) return 2;
  if (maxMiles < 10) return 1;
  return 0;
}

export function formatDistanceMilesLabel(miles: number, decimals?: number): string {
  const precision = decimals ?? getDistanceDecimals(Math.max(miles, 0.0001));
  if (miles === 0) return '0 mi';
  return `${Number(miles.toFixed(precision))} mi`;
}

/** Shared distance grid for x-axis labels and chart resampling. */
export function buildDistanceGrid(maxMiles: number, segmentCount = 5): number[] {
  if (maxMiles <= 0) return [0];

  const decimals = getDistanceDecimals(maxMiles);
  const grid: number[] = [];
  const seen = new Set<number>();

  for (let index = 0; index <= segmentCount; index += 1) {
    const value = Number(((maxMiles / segmentCount) * index).toFixed(decimals));
    if (seen.has(value)) continue;
    seen.add(value);
    grid.push(value);
  }

  const maxRounded = Number(maxMiles.toFixed(decimals));
  if (!seen.has(maxRounded)) {
    grid.push(maxRounded);
  }

  return grid;
}

export function buildDistanceAxisTicks(maxMiles: number, segmentCount = 5): DistanceAxisTick[] {
  const decimals = getDistanceDecimals(Math.max(maxMiles, 0.0001));
  return buildDistanceGrid(maxMiles, segmentCount).map((value, index) => ({
    id: `tick-${index}-${value}`,
    value,
    label: formatDistanceMilesLabel(value, decimals),
  }));
}

export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}
