import { buildHeartRateAnalysis } from '../heartRateAnalysisService';
import type { ActivityRecord } from '../../types/activity';

function buildRecords(specs: { paceSecPerMile: number; bpm: number; durationSeconds: number }[]): ActivityRecord[] {
  let records: ActivityRecord[] = [];
  let elapsed = 0;
  let distance = 0;

  for (const spec of specs) {
    const metersPerSecond = 1609.344 / spec.paceSecPerMile;
    const points = Math.max(2, Math.round(spec.durationSeconds / 5));
    for (let i = 0; i <= points; i += 1) {
      const t = (i / points) * spec.durationSeconds;
      // Small jitter so consecutive samples aren't identical — real sensors
      // never hold an exact flat value for a full minute, and the cleaner
      // correctly treats a long run of identical values as a stuck sensor.
      const jitter = (i % 3) - 1;
      records.push({
        timestamp: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
        distanceMeters: distance + metersPerSecond * t,
        elapsedSeconds: elapsed + t,
        speedMps: metersPerSecond,
        heartRateBpm: spec.bpm + jitter,
        source: 'phone-gps',
      });
    }
    elapsed += spec.durationSeconds;
    distance += metersPerSecond * spec.durationSeconds;
  }

  return records;
}

describe('buildHeartRateAnalysis', () => {
  it('returns unavailable when there is no heart-rate data', () => {
    const records = buildRecords([{ paceSecPerMile: 540, bpm: 150, durationSeconds: 600 }]).map((r) => ({
      ...r,
      heartRateBpm: undefined,
    }));
    const result = buildHeartRateAnalysis(records);
    expect(result.state).toBe('unavailable');
  });

  it('builds a full zone breakdown for a run with rising heart rate at steady pace', () => {
    const records = buildRecords([
      { paceSecPerMile: 540, bpm: 130, durationSeconds: 300 },
      { paceSecPerMile: 540, bpm: 150, durationSeconds: 300 },
      { paceSecPerMile: 540, bpm: 165, durationSeconds: 300 },
      { paceSecPerMile: 540, bpm: 175, durationSeconds: 300 },
    ]);

    const result = buildHeartRateAnalysis(records);
    expect(result.state).toBe('full');
    if (result.state !== 'full') return;

    const totalPct = result.zones.reduce((sum, z) => sum + z.percentOfValidTime, 0);
    expect(Math.round(totalPct)).toBeGreaterThanOrEqual(99);
    expect(Math.round(totalPct)).toBeLessThanOrEqual(101);
    expect(result.avgBpm).toBeGreaterThan(130);
    expect(result.maxSustainedBpm).toBeGreaterThanOrEqual(175);
  });

  it('detects an interval-style effort with alternating hard and recovery segments', () => {
    let specs: { paceSecPerMile: number; bpm: number; durationSeconds: number }[] = [];
    for (let i = 0; i < 5; i += 1) {
      specs.push({ paceSecPerMile: 360, bpm: 178, durationSeconds: 120 });
      specs.push({ paceSecPerMile: 720, bpm: 120, durationSeconds: 120 });
    }
    const records = buildRecords(specs);
    const result = buildHeartRateAnalysis(records);
    expect(result.state).toBe('full');
    if (result.state !== 'full') return;
    expect(result.profile).toBe('Interval Effort');
  });
});
