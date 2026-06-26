import type { PostRunSummary } from '../../mock';
import type { ActivityRecord, StoredActivity } from '../../types/activity';
import { buildPostRunSummary } from '../buildPostRunSummary';

const METERS_PER_MILE = 1609.344;

function recordAt(
  index: number,
  distanceMeters: number,
  elapsedSeconds: number,
  altitudeMeters: number,
): ActivityRecord {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1, 12, 0, index)).toISOString(),
    latitude: 37.7749 + index * 0.0001,
    longitude: -122.4194 + index * 0.0001,
    distanceMeters,
    elapsedSeconds,
    altitudeMeters,
    source: 'mock',
  };
}

/** Build a completed run with exact cumulative distance (miles) and optional pace/elevation. */
export function makeMockRunActivity(options: {
  distanceMiles: number;
  paceSecondsPerMile?: number;
  elevationGainFeet?: number;
  sessionId?: string;
}): StoredActivity {
  const distanceMeters = options.distanceMiles * METERS_PER_MILE;
  const paceSecondsPerMile = options.paceSecondsPerMile ?? 8 * 60;
  const elapsedSeconds =
    options.distanceMiles > 0
      ? Math.max(1, Math.round(options.distanceMiles * paceSecondsPerMile))
      : 0;

  const records: ActivityRecord[] = [recordAt(0, 0, 0, 100)];

  if (distanceMeters > 0) {
    const climbFeet = options.elevationGainFeet ?? 0;
    const endAltitudeMeters = 100 + climbFeet / 3.28084;
    records.push(recordAt(1, distanceMeters, elapsedSeconds, endAltitudeMeters));
  }

  const session = {
    id: options.sessionId ?? `mock-run-${distanceMeters}-${Date.now()}`,
    status: 'completed' as const,
    startedAt: records[0].timestamp,
    endedAt: records[records.length - 1]?.timestamp,
    pausedDurationMs: 0,
    source: 'mock' as const,
  };

  const summary: PostRunSummary = buildPostRunSummary(
    session,
    records,
    session.endedAt ?? session.startedAt,
  );

  return { session, records, summary };
}
