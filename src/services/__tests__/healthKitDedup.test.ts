import { isDuplicateOfExisting } from '../healthKitDedup';

describe('isDuplicateOfExisting', () => {
  it('flags a workout with close start time and close distance as a duplicate', () => {
    const existing = [{ startedAt: new Date('2026-07-19T12:00:00Z'), distanceMeters: 5000 }];
    const candidate = { startedAt: new Date('2026-07-19T12:01:30Z'), distanceMeters: 5100 };
    expect(isDuplicateOfExisting(candidate, existing)).toBe(true);
  });

  it('does not flag workouts far apart in time', () => {
    const existing = [{ startedAt: new Date('2026-07-19T12:00:00Z'), distanceMeters: 5000 }];
    const candidate = { startedAt: new Date('2026-07-19T13:00:00Z'), distanceMeters: 5000 };
    expect(isDuplicateOfExisting(candidate, existing)).toBe(false);
  });

  it('does not flag workouts with very different distances despite close timing', () => {
    const existing = [{ startedAt: new Date('2026-07-19T12:00:00Z'), distanceMeters: 5000 }];
    const candidate = { startedAt: new Date('2026-07-19T12:00:30Z'), distanceMeters: 500 };
    expect(isDuplicateOfExisting(candidate, existing)).toBe(false);
  });

  it('treats two zero-distance workouts at the same time as duplicates', () => {
    const existing = [{ startedAt: new Date('2026-07-19T12:00:00Z'), distanceMeters: 0 }];
    const candidate = { startedAt: new Date('2026-07-19T12:00:10Z'), distanceMeters: 0 };
    expect(isDuplicateOfExisting(candidate, existing)).toBe(true);
  });

  it('returns false when there is nothing to compare against', () => {
    const candidate = { startedAt: new Date(), distanceMeters: 5000 };
    expect(isDuplicateOfExisting(candidate, [])).toBe(false);
  });
});
