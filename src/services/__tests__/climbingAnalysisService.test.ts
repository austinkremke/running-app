import { buildClimbingAnalysis } from '../climbingAnalysisService';
import type { ActivityRecord } from '../../types/activity';
import type { PaceProfile } from '../../types/paceAnalysis';

const profile: PaceProfile = {
  recoveryThresholdSec: 660,
  easyThresholdSec: 540,
  workoutThresholdSec: 450,
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

/** Builds records for a segment of constant pace and grade. */
function buildSegmentRecords(
  paceSecPerMile: number,
  gradePercent: number,
  durationSeconds: number,
  startElapsed: number,
  startDistance: number,
  startAltitude: number,
): ActivityRecord[] {
  const metersPerSecond = 1609.344 / paceSecPerMile;
  const points = Math.max(2, Math.round(durationSeconds / 5));
  const records: ActivityRecord[] = [];
  for (let i = 0; i <= points; i += 1) {
    const t = (i / points) * durationSeconds;
    const distance = metersPerSecond * t;
    records.push({
      timestamp: new Date().toISOString(),
      latitude: 0,
      longitude: 0,
      distanceMeters: startDistance + distance,
      elapsedSeconds: startElapsed + t,
      speedMps: metersPerSecond,
      altitudeMeters: startAltitude + distance * (gradePercent / 100),
      source: 'phone-gps',
    });
  }
  return records;
}

function concatSegments(specs: { paceSecPerMile: number; gradePercent: number; durationSeconds: number }[]): ActivityRecord[] {
  let records: ActivityRecord[] = [];
  let elapsed = 0;
  let distance = 0;
  let altitude = 0;

  for (const spec of specs) {
    const segmentRecords = buildSegmentRecords(spec.paceSecPerMile, spec.gradePercent, spec.durationSeconds, elapsed, distance, altitude);
    records = records.concat(segmentRecords);
    const last = segmentRecords[segmentRecords.length - 1];
    elapsed = last.elapsedSeconds;
    distance = last.distanceMeters;
    altitude = last.altitudeMeters!;
  }

  return records;
}

describe('buildClimbingAnalysis', () => {
  it('detects a meaningful sustained climb and flags a fade in the final third', () => {
    // ~0.5mi flat, then a climb: fast start, slower middle, much slower end (fade)
    const records = concatSegments([
      { paceSecPerMile: 540, gradePercent: 0, durationSeconds: 300 },
      { paceSecPerMile: 480, gradePercent: 5, durationSeconds: 100 },
      { paceSecPerMile: 540, gradePercent: 5, durationSeconds: 100 },
      { paceSecPerMile: 620, gradePercent: 5, durationSeconds: 100 },
      { paceSecPerMile: 540, gradePercent: 0, durationSeconds: 200 },
    ]);

    const result = buildClimbingAnalysis(records, profile);
    expect(result.state).toBe('full');
    if (result.state !== 'full') return;

    expect(result.meaningfulClimbCount).toBe(1);
    const climb = result.climbs[0];
    expect(climb.avgGradePercent).toBeGreaterThan(3);
    expect(climb.pacing === 'Moderate Fade' || climb.pacing === 'Significant Fade').toBe(true);
  });

  it('reports minimal climbing for an essentially flat route', () => {
    const records = concatSegments([{ paceSecPerMile: 540, gradePercent: 0.2, durationSeconds: 1200 }]);
    const result = buildClimbingAnalysis(records, profile);
    expect(result.state).toBe('minimal');
  });

  it('returns unavailable when there is no altitude data', () => {
    const records: ActivityRecord[] = concatSegments([
      { paceSecPerMile: 540, gradePercent: 0, durationSeconds: 300 },
    ]).map((r) => ({ ...r, altitudeMeters: null }));

    const result = buildClimbingAnalysis(records, profile);
    expect(result.state).toBe('unavailable');
  });

  it('does not manufacture climbs from a single short noisy bump', () => {
    const records = concatSegments([
      { paceSecPerMile: 540, gradePercent: 0, durationSeconds: 200 },
      { paceSecPerMile: 540, gradePercent: 4, durationSeconds: 20 }, // too short to count
      { paceSecPerMile: 540, gradePercent: 0, durationSeconds: 200 },
    ]);

    const result = buildClimbingAnalysis(records, profile);
    if (result.state === 'full') {
      expect(result.meaningfulClimbCount).toBe(0);
    } else {
      expect(result.state).toBe('minimal');
    }
  });
});
