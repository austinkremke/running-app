import { computeVerificationTier } from '../healthKitVerification';
import type { ActivityRecord } from '../../types/activity';

function buildRecords(paces: { elapsedSeconds: number; distanceMeters: number; heartRateBpm: number | null }[]): ActivityRecord[] {
  return paces.map((p) => ({
    timestamp: new Date().toISOString(),
    latitude: null,
    longitude: null,
    distanceMeters: p.distanceMeters,
    elapsedSeconds: p.elapsedSeconds,
    heartRateBpm: p.heartRateBpm,
    source: 'healthkit',
  }));
}

const plausibleRecords = buildRecords([
  { elapsedSeconds: 0, distanceMeters: 0, heartRateBpm: 120 },
  { elapsedSeconds: 60, distanceMeters: 200, heartRateBpm: 140 },
  { elapsedSeconds: 120, distanceMeters: 400, heartRateBpm: 150 },
]);

describe('computeVerificationTier', () => {
  it('verifies a plausible, recent, device-recorded workout with HR', () => {
    const result = computeVerificationTier({
      wasUserEntered: false,
      workoutEnd: new Date(),
      records: plausibleRecords,
    });
    expect(result.tier).toBe('verified');
    expect(result.reason).toBeNull();
  });

  it('rejects manually entered workouts', () => {
    const result = computeVerificationTier({
      wasUserEntered: true,
      workoutEnd: new Date(),
      records: plausibleRecords,
    });
    expect(result.tier).toBe('unverified');
    expect(result.reason).toMatch(/manually entered/i);
  });

  it('rejects future-dated workouts', () => {
    const result = computeVerificationTier({
      wasUserEntered: false,
      workoutEnd: new Date(Date.now() + 10 * 60 * 1000),
      records: plausibleRecords,
    });
    expect(result.tier).toBe('unverified');
    expect(result.reason).toMatch(/future/i);
  });

  it('rejects workouts older than the recency window', () => {
    const result = computeVerificationTier({
      wasUserEntered: false,
      workoutEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      records: plausibleRecords,
    });
    expect(result.tier).toBe('unverified');
    expect(result.reason).toMatch(/recency window/i);
  });

  it('rejects workouts with no heart rate data', () => {
    const records = buildRecords([
      { elapsedSeconds: 0, distanceMeters: 0, heartRateBpm: null },
      { elapsedSeconds: 60, distanceMeters: 200, heartRateBpm: null },
    ]);
    const result = computeVerificationTier({ wasUserEntered: false, workoutEnd: new Date(), records });
    expect(result.tier).toBe('unverified');
    expect(result.reason).toMatch(/no heart rate/i);
  });

  it('rejects implausible heart rate values', () => {
    const records = buildRecords([
      { elapsedSeconds: 0, distanceMeters: 0, heartRateBpm: 300 },
      { elapsedSeconds: 60, distanceMeters: 200, heartRateBpm: 140 },
    ]);
    const result = computeVerificationTier({ wasUserEntered: false, workoutEnd: new Date(), records });
    expect(result.tier).toBe('unverified');
    expect(result.reason).toMatch(/implausible heart rate/i);
  });

  it('rejects implausible pace between samples', () => {
    const records = buildRecords([
      { elapsedSeconds: 0, distanceMeters: 0, heartRateBpm: 120 },
      { elapsedSeconds: 10, distanceMeters: 5000, heartRateBpm: 130 }, // 500 m/s
    ]);
    const result = computeVerificationTier({ wasUserEntered: false, workoutEnd: new Date(), records });
    expect(result.tier).toBe('unverified');
    expect(result.reason).toMatch(/implausible pace/i);
  });
});
