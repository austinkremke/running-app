import { computeMileSplits } from '../activityStreams';
import type { ActivityRecord } from '../../types/activity';

const METERS_PER_MILE = 1609.344;

// Build a record every 0.1 mi at a given per-mile pace (seconds), with optional altitude ramp.
function buildRecords(
  paceSecondsPerMile: number,
  totalMiles: number,
  altitudeStart = 0,
  altitudeEndMeters = 0,
): ActivityRecord[] {
  const records: ActivityRecord[] = [];
  const stepMiles = 0.1;
  const steps = Math.round(totalMiles / stepMiles);

  for (let i = 0; i <= steps; i += 1) {
    const miles = i * stepMiles;
    records.push({
      timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, Math.round(miles * paceSecondsPerMile))).toISOString(),
      latitude: 0,
      longitude: 0,
      distanceMeters: miles * METERS_PER_MILE,
      elapsedSeconds: miles * paceSecondsPerMile,
      altitudeMeters: altitudeStart + (altitudeEndMeters - altitudeStart) * (miles / totalMiles),
      source: 'phone-gps',
    });
  }

  return records;
}

describe('computeMileSplits', () => {
  it('returns one full split per mile at the expected pace', () => {
    const splits = computeMileSplits(buildRecords(480, 3));

    expect(splits).toHaveLength(3);
    expect(splits.map((s) => s.mile)).toEqual([1, 2, 3]);
    for (const split of splits) {
      expect(split.distanceMiles).toBe(1);
      expect(split.isPartial).toBe(false);
      expect(split.paceSeconds).toBeGreaterThanOrEqual(478);
      expect(split.paceSeconds).toBeLessThanOrEqual(482);
    }
  });

  it('adds a trailing partial split with normalized pace', () => {
    const splits = computeMileSplits(buildRecords(600, 2.5));

    expect(splits).toHaveLength(3);
    const last = splits[2];
    expect(last.isPartial).toBe(true);
    expect(last.distanceMiles).toBeCloseTo(0.5, 1);
    // Pace is per-mile normalized, so the partial mile still reports ~600s/mi.
    expect(last.paceSeconds).toBeGreaterThanOrEqual(595);
    expect(last.paceSeconds).toBeLessThanOrEqual(605);
  });

  it('reports net elevation change per split in feet', () => {
    // Climb 160 m over 2 mi => ~80 m per mile => ~262 ft per full mile.
    const splits = computeMileSplits(buildRecords(500, 2, 0, 160));

    expect(splits[0].elevationChangeFt).toBeGreaterThan(200);
    expect(splits[0].elevationChangeFt).toBeLessThan(320);
  });

  it('returns [] for runs shorter than a hundredth of a mile or without a track', () => {
    expect(computeMileSplits([])).toEqual([]);
    expect(computeMileSplits(buildRecords(480, 0.005))).toEqual([]);
  });
});
