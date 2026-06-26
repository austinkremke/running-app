import type { PostRunSummary } from '../../../mock';
import type { ActivityRecord, StoredActivity } from '../../../types/activity';
import { makeMockRunActivity } from '../mockRunActivity';

export const DEV_XP_USER_ID = '8ef1125e-30dc-440c-8662-6234dcfc13b5';

export const defaultUserStats = {
  streakDays: 1,
  rollingAvgPaceSec: null as number | null,
  awardedToday: false,
};

/** @deprecated Use makeMockRunActivity from mockRunActivity.ts */
export function makeRunActivity(options: {
  distanceMiles: number;
  paceSecondsPerMile?: number;
  elevationGainFeet?: number;
}): StoredActivity {
  return makeMockRunActivity(options);
}
