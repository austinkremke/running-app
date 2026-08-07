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

  it('uses real incremental distance samples instead of a flat linear apportionment when available', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    const end = new Date(start.getTime() + 60_000); // 1 minute, 60m total
    // Ran fast for the first half (50m in 30s), then slow for the second (10m in 30s) —
    // a flat/linear apportionment would put every 15s tick 15m apart regardless.
    const distanceSamples = [
      { startDate: start, endDate: new Date(start.getTime() + 30_000), quantity: 50 },
      { startDate: new Date(start.getTime() + 30_000), endDate: end, quantity: 10 },
    ];

    const records = buildRecordsFromTimeGrid(start, end, 60, [], distanceSamples);

    const at15s = records.find((r) => r.elapsedSeconds === 15)!;
    const at45s = records.find((r) => r.elapsedSeconds === 45)!;

    // Fast half: 15s into a 30s/50m segment ⇒ ~25m, not the linear-fraction 15m.
    expect(at15s.distanceMeters).toBeCloseTo(25, 0);
    // Slow half: 50m (first segment) + half of the remaining 10m ⇒ ~55m, not 45m.
    expect(at45s.distanceMeters).toBeCloseTo(55, 0);
  });

  it('bridges gaps between samples with a straight line instead of holding flat then jumping', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    const end = new Date(start.getTime() + 60_000);
    // Two samples with a real 20s gap in between (no coverage from 20s-40s) —
    // bursty/irregular reporting, which is common for Garmin-sourced data.
    const distanceSamples = [
      { startDate: start, endDate: new Date(start.getTime() + 20_000), quantity: 40 },
      { startDate: new Date(start.getTime() + 40_000), endDate: end, quantity: 40 },
    ];

    const records = buildRecordsFromTimeGrid(start, end, 80, [], distanceSamples);
    const beforeGap = records.find((r) => r.elapsedSeconds === 15)!;
    const midGap = records.find((r) => r.elapsedSeconds === 30)!;
    const afterGap = records.find((r) => r.elapsedSeconds === 45)!;

    // A flat hold would keep midGap pinned at exactly 40 (the value at the
    // start of the gap) until the next real sample resumes at 40s — a
    // straight-line bridge should instead keep advancing smoothly through it.
    expect(midGap.distanceMeters).toBeGreaterThan(beforeGap.distanceMeters);
    expect(afterGap.distanceMeters).toBeGreaterThan(midGap.distanceMeters);
    // Bridged as one straight line from the checkpoint at 20s (40m) to the
    // checkpoint at 60s (80m): at 30s that's 40 + (10/40)*40 = 50m — not
    // pinned flat at 40 the way a hold-during-gap approach would leave it.
    expect(midGap.distanceMeters).toBeCloseTo(50, 0);
  });

  it('rescales distance samples to the trusted workout total instead of trusting a doubled/duplicated raw sum', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    const end = new Date(start.getTime() + 60_000);
    // Simulates HealthKit returning a duplicated stream — same shape, 2x the
    // real total (60m of real distance reported as 120m of raw samples).
    const distanceSamples = [
      { startDate: start, endDate: new Date(start.getTime() + 30_000), quantity: 100 },
      { startDate: new Date(start.getTime() + 30_000), endDate: end, quantity: 20 },
    ];

    const records = buildRecordsFromTimeGrid(start, end, 60, [], distanceSamples);
    const last = records[records.length - 1];

    // Must land on the trusted total (60m), not the raw/duplicated sum (120m) —
    // this is what feeds the run's actual displayed distance/pace, not just the chart.
    expect(last.distanceMeters).toBeCloseTo(60, 0);
  });

  it('falls back to flat apportionment when the sample total is wildly implausible vs. the trusted total', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    const end = new Date(start.getTime() + 60_000);
    // Raw samples sum to 10x the trusted total — too implausible to rescale
    // and trust the shape of; safer to fall back entirely.
    const distanceSamples = [{ startDate: start, endDate: end, quantity: 600 }];

    const records = buildRecordsFromTimeGrid(start, end, 60, [], distanceSamples);
    const at30s = records.find((r) => r.elapsedSeconds === 30)!;

    // Flat apportionment: half the elapsed time ⇒ half the trusted distance.
    expect(at30s.distanceMeters).toBeCloseTo(30, 0);
  });

  it('interpolates heart rate between real samples instead of snapping to the nearest one', () => {
    const start = new Date('2026-07-19T12:00:00Z');
    const end = new Date(start.getTime() + 30_000);
    const heartRateSamples = [
      { startDate: start, quantity: 100 },
      { startDate: end, quantity: 140 },
    ];

    const records = buildRecordsFromTimeGrid(start, end, 100, heartRateSamples);
    const midpoint = records.find((r) => r.elapsedSeconds === 15)!;

    // Nearest-neighbor would snap to either 100 or 140; true interpolation at
    // the exact midpoint should land close to the average of the two.
    expect(midpoint.heartRateBpm).toBeGreaterThan(100);
    expect(midpoint.heartRateBpm).toBeLessThan(140);
    expect(midpoint.heartRateBpm).toBeCloseTo(120, 0);
  });
});
