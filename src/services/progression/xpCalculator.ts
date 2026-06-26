import {
  BASE_XP_PER_MILE,
  DIMINISHING_DISTANCE_MILES,
  ELEVATION_XP_PER_50_FT,
  FIRST_RUN_TODAY_BONUS,
  MAX_PACE_BONUS_RATIO,
  MAX_STREAK_DAYS,
  MAX_XP_PER_RUN,
  STREAK_MULTIPLIER_PER_DAY,
} from '../../config/xpRewards';
import type { XpBreakdownLine } from '../../types/progression';
import type { StoredActivity } from '../../types/activity';
import { xpMinDistanceMiles } from '../../config/devXp';
import {
  averagePaceSecondsPerMile,
  elevationGainFeet,
  totalDistanceMeters,
} from '../activityMetrics';
import { metersToMiles } from '../distanceService';

/** Same rounding as post-run summary — avoids 0.099 mi GPS reading showing as 0.10 mi. */
function displayDistanceMiles(records: StoredActivity['records']): number {
  return Number(metersToMiles(totalDistanceMeters(records)).toFixed(2));
}

export type XpUserStats = {
  streakDays: number;
  rollingAvgPaceSec: number | null;
  awardedToday: boolean;
};

export type XpAwardResult = {
  totalXp: number;
  breakdown: XpBreakdownLine[];
};

function streakMultiplier(streakDays: number): number {
  return 1 + STREAK_MULTIPLIER_PER_DAY * Math.min(Math.max(streakDays, 0), MAX_STREAK_DAYS);
}

function paceBonusXp(
  distanceXp: number,
  avgPaceSec: number,
  rollingAvgPaceSec: number | null,
): number {
  if (!rollingAvgPaceSec || rollingAvgPaceSec <= 0 || avgPaceSec <= 0) {
    return 0;
  }

  if (avgPaceSec >= rollingAvgPaceSec) {
    return 0;
  }

  const improvementRatio = Math.min(
    1,
    (rollingAvgPaceSec - avgPaceSec) / rollingAvgPaceSec,
  );

  return Math.round(distanceXp * MAX_PACE_BONUS_RATIO * improvementRatio);
}

export function computeXpFromActivity(
  activity: StoredActivity,
  userStats: XpUserStats,
  userId?: string | null,
): XpAwardResult {
  const distanceMeters = totalDistanceMeters(activity.records);
  const miles = metersToMiles(distanceMeters);
  const displayMiles = displayDistanceMiles(activity.records);
  const breakdown: XpBreakdownLine[] = [];
  const minDistanceMiles = xpMinDistanceMiles(userId);

  if (displayMiles < minDistanceMiles) {
    return { totalXp: 0, breakdown };
  }

  let distanceXp = Math.floor(miles * BASE_XP_PER_MILE);
  if (miles < DIMINISHING_DISTANCE_MILES) {
    distanceXp = Math.floor(distanceXp * (miles / DIMINISHING_DISTANCE_MILES));
  }

  if (distanceXp > 0) {
    breakdown.push({ key: 'distance', label: 'Distance', xp: distanceXp });
  }

  const avgPaceSec = averagePaceSecondsPerMile(activity.records);
  const paceXp = paceBonusXp(distanceXp, avgPaceSec, userStats.rollingAvgPaceSec);
  if (paceXp > 0) {
    breakdown.push({ key: 'pace', label: 'Pace effort', xp: paceXp });
  }

  const elevationGainFt = elevationGainFeet(activity.records);
  const elevationXp = Math.floor(elevationGainFt / 50) * ELEVATION_XP_PER_50_FT;
  if (elevationXp > 0) {
    breakdown.push({ key: 'elevation', label: 'Elevation', xp: elevationXp });
  }

  const subtotal = distanceXp + paceXp + elevationXp;
  const multiplier = streakMultiplier(userStats.streakDays);
  const streakBonusXp =
    userStats.streakDays > 0 ? Math.round(subtotal * (multiplier - 1)) : 0;

  if (streakBonusXp > 0) {
    breakdown.push({
      key: 'streak',
      label: `${userStats.streakDays}-day streak`,
      xp: streakBonusXp,
    });
  }

  const firstRunTodayXp =
    userStats.awardedToday ? 0 : FIRST_RUN_TODAY_BONUS;
  if (firstRunTodayXp > 0) {
    breakdown.push({
      key: 'first-run-today',
      label: 'First run today',
      xp: firstRunTodayXp,
    });
  }

  const totalXp = Math.min(
    MAX_XP_PER_RUN,
    Math.round(subtotal * multiplier) + firstRunTodayXp,
  );

  return { totalXp, breakdown };
}
