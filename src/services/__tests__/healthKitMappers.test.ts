import { buildRecordsFromRoute, buildRecordsFromTimeGrid } from '../healthKitMappers';

describe('buildRecordsFromRoute', () => {
  it('builds records with coordinates and cumulative distance from route locations', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    const locations = [
      { date: start, latitude: 30.2672, longitude: -97.7431, altitude: 150 },
      { date: new Date(start.getTime() + 10_000), latitude: 30.2682, longitude: -97.7431, altitude: 151 },
      { date: new Date(start.getTime() + 20_000), latitude: 30.2692, longitude: -97.7431, altitude: 152 },
    ];
    const heartRateSamples = [
      { startDate: start, quantity: 120 },
      { startDate: new Date(start.getTime() + 20_000), quantity: 140 },
    ];

    const records = buildRecordsFromRoute(locations, heartRateSamples, start);

    expect(records).toHaveLength(3);
    expect(records[0].latitude).toBe(30.2672);
    expect(records[0].distanceMeters).toBe(0);
    expect(records[2].distanceMeters).toBeGreaterThan(0);
    expect(records[2].elapsedSeconds).toBe(20);
    expect(records[0].heartRateBpm).toBe(120);
    expect(records[2].heartRateBpm).toBe(140);
    expect(records.every((r) => r.source === 'healthkit')).toBe(true);
  });

  it('returns [] for an empty route', () => {
    expect(buildRecordsFromRoute([], [], new Date())).toEqual([]);
  });
});

describe('buildRecordsFromTimeGrid', () => {
  it('builds route-less records with distance apportioned linearly across elapsed time', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    const end = new Date(start.getTime() + 60_000); // 1 minute
    const heartRateSamples = [
      { startDate: start, quantity: 110 },
      { startDate: new Date(start.getTime() + 60_000), quantity: 150 },
    ];

    const records = buildRecordsFromTimeGrid(start, end, 200, heartRateSamples);

    expect(records.length).toBeGreaterThan(1);
    expect(records.every((r) => r.latitude === null && r.longitude === null)).toBe(true);
    expect(records[0].distanceMeters).toBe(0);
    expect(records[records.length - 1].distanceMeters).toBeCloseTo(200, 0);
    expect(records[0].heartRateBpm).toBe(110);
    expect(records[records.length - 1].heartRateBpm).toBe(150);
  });

  it('returns [] when end is not after start', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    expect(buildRecordsFromTimeGrid(start, start, 100, [])).toEqual([]);
  });
});
