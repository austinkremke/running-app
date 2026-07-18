import { buildPaceDistribution } from '../paceDistributionService';
import type { ActivityRecord } from '../../types/activity';
import type { PaceProfile } from '../../types/paceAnalysis';

const profile: PaceProfile = {
  recoveryThresholdSec: 660, // 11:00/mi
  easyThresholdSec: 540, // 9:00/mi
  workoutThresholdSec: 450, // 7:30/mi
  runCount: 10,
  sampleCount: 300,
  confidence: 'high',
  computedAt: new Date().toISOString(),
  avgRecoveryPct: 10,
  avgEasyPct: 60,
  avgWorkoutPct: 25,
  avgHardPct: 5,
  longestWorkoutSeconds: 300,
  longestHardSeconds: 60,
};

function buildRecords(paceSecPerMile: number, durationSeconds: number, startElapsed: number, startDistance: number): ActivityRecord[] {
  const metersPerSecond = 1609.344 / paceSecPerMile;
  const points = Math.max(2, Math.round(durationSeconds / 5));
  const records: ActivityRecord[] = [];
  for (let i = 0; i <= points; i += 1) {
    const t = (i / points) * durationSeconds;
    records.push({
      timestamp: new Date().toISOString(),
      latitude: 0,
      longitude: 0,
      distanceMeters: startDistance + metersPerSecond * t,
      elapsedSeconds: startElapsed + t,
      speedMps: metersPerSecond,
      altitudeMeters: 0,
      source: 'phone-gps',
    });
  }
  return records;
}

describe('buildPaceDistribution', () => {
  it('classifies a steady easy run and sums ranges to ~100%', () => {
    const records = buildRecords(560, 1800, 0, 0); // 30 min at ~9:20/mi (Easy)
    const result = buildPaceDistribution(records, profile);

    expect(result).not.toBeNull();
    expect(result!.classification).toBe('Easy Run');

    const totalPct = result!.ranges.reduce((sum, r) => sum + r.percentOfMoving, 0);
    expect(Math.round(totalPct)).toBeGreaterThanOrEqual(99);
    expect(Math.round(totalPct)).toBeLessThanOrEqual(101);
  });

  it('classifies a hard interval-style run with alternating fast/slow segments', () => {
    let records: ActivityRecord[] = [];
    let elapsed = 0;
    let distance = 0;

    for (let rep = 0; rep < 5; rep += 1) {
      const fast = buildRecords(360, 120, elapsed, distance); // 6:00/mi, 2 min (Hard)
      elapsed = fast[fast.length - 1].elapsedSeconds;
      distance = fast[fast.length - 1].distanceMeters;
      records = records.concat(fast);

      const slow = buildRecords(720, 120, elapsed, distance); // 12:00/mi, 2 min (Recovery)
      elapsed = slow[slow.length - 1].elapsedSeconds;
      distance = slow[slow.length - 1].distanceMeters;
      records = records.concat(slow);
    }

    const result = buildPaceDistribution(records, profile);
    expect(result).not.toBeNull();
    expect(result!.classification).toBe('Interval Run');
  });

  it('returns null when there is no usable moving time', () => {
    const records: ActivityRecord[] = [
      { timestamp: new Date().toISOString(), latitude: 0, longitude: 0, distanceMeters: 0, elapsedSeconds: 0, source: 'phone-gps' },
      { timestamp: new Date().toISOString(), latitude: 0, longitude: 0, distanceMeters: 0, elapsedSeconds: 5, source: 'phone-gps' },
    ];
    expect(buildPaceDistribution(records, profile)).toBeNull();
  });
});
