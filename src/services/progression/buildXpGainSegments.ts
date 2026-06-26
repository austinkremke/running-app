import {
  DIMINISHING_DISTANCE_MILES,
  MAX_STREAK_DAYS,
  STREAK_MULTIPLIER_PER_DAY,
} from '../../config/xpRewards';
import type { StoredActivity } from '../../types/activity';
import type { XpBreakdownLine, XpGainSegment } from '../../types/progression';
import {
  averagePaceSecondsPerMile,
  elevationGainFeet,
  totalDistanceMeters,
} from '../activityMetrics';
import { formatPace, metersToMiles } from '../distanceService';
import type { XpUserStats } from './xpCalculator';

function streakMultiplier(streakDays: number): number {
  return 1 + STREAK_MULTIPLIER_PER_DAY * Math.min(Math.max(streakDays, 0), MAX_STREAK_DAYS);
}

export function buildXpGainSegments(
  breakdown: XpBreakdownLine[],
  activity: StoredActivity,
  userStats: XpUserStats,
): XpGainSegment[] {
  const miles = Number(metersToMiles(totalDistanceMeters(activity.records)).toFixed(2));
  const avgPaceSec = averagePaceSecondsPerMile(activity.records);
  const elevationFt = elevationGainFeet(activity.records);

  return breakdown.map((line) => {
    let detail: string | undefined;

    switch (line.key) {
      case 'distance':
        detail = `${miles.toFixed(2)} mi`;
        if (miles < DIMINISHING_DISTANCE_MILES) {
          detail += ' · short run';
        }
        break;
      case 'pace':
        if (userStats.rollingAvgPaceSec) {
          detail = `${formatPace(avgPaceSec)}/mi vs your ${formatPace(userStats.rollingAvgPaceSec)} avg`;
        }
        break;
      case 'elevation':
        detail = `+${elevationFt} ft climbed`;
        break;
      case 'streak':
        detail = `×${streakMultiplier(userStats.streakDays).toFixed(2)} on base XP`;
        break;
      case 'first-run-today':
        detail = 'Daily bonus';
        break;
      default:
        break;
    }

    return {
      key: line.key,
      label: line.label,
      detail,
      xp: line.xp,
    };
  });
}
