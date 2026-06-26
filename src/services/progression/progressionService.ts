import type { XpGainRunSummary } from '../../types/progression';
import type { StoredProgression, XpLedgerEntry } from '../../types/progression';
import type { StoredActivity } from '../../types/activity';
import { readProgression, appendLedgerEntry } from '../../storage/progressionStorage';
import { averagePaceSecondsPerMile } from '../activityMetrics';
import { buildXpGainEvent } from './buildXpGainEvent';
import { buildXpGainSegments } from './buildXpGainSegments';
import { computeXpFromActivity } from './xpCalculator';

export type AwardRunXpResult = {
  xpEarned: number;
  event: ReturnType<typeof buildXpGainEvent>;
  progression: StoredProgression;
  alreadyAwarded: boolean;
};

function todayKey(isoDate = new Date()): string {
  return isoDate.toISOString().slice(0, 10);
}

function yesterdayKey(isoDate = new Date()): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

function nextStreakDays(current: StoredProgression, awardDate: string): number {
  if (current.lastAwardDate === awardDate) {
    return current.streakDays;
  }

  if (current.lastAwardDate === yesterdayKey()) {
    return Math.max(1, current.streakDays + 1);
  }

  return 1;
}

function nextRollingAvgPaceSec(
  current: number | null,
  nextPaceSec: number,
): number | null {
  if (nextPaceSec <= 0) {
    return current;
  }

  if (!current || current <= 0) {
    return nextPaceSec;
  }

  return Math.round(current * 0.7 + nextPaceSec * 0.3);
}

function runSummaryFromActivity(activity: StoredActivity): XpGainRunSummary {
  const { summary } = activity;

  return {
    distance: `${summary.distanceMiles.toFixed(2)} mi`,
    duration: summary.duration,
    pace: `${summary.avgPace}${summary.avgPaceUnit}`,
  };
}

export async function loadProgressionForUser(
  userId: string,
  serverTotalXp = 0,
): Promise<StoredProgression> {
  const local = await readProgression(userId);
  if (serverTotalXp <= local.totalXp) {
    return local;
  }

  return {
    ...local,
    totalXp: serverTotalXp,
  };
}

export async function awardRunXp(
  userId: string,
  activity: StoredActivity,
): Promise<AwardRunXpResult> {
  const progression = await readProgression(userId);
  const activityId = activity.session.id;
  const alreadyAwarded = progression.ledger.some(
    (entry) =>
      entry.source === 'run' && entry.sourceId === activityId && entry.totalXp > 0,
  );

  if (alreadyAwarded) {
    return {
      xpEarned: 0,
      event: buildXpGainEvent(progression.totalXp, 0, runSummaryFromActivity(activity)),
      progression,
      alreadyAwarded: true,
    };
  }

  const awardDate = todayKey();
  const awardedToday = progression.lastAwardDate === awardDate;
  const nextStreak = nextStreakDays(progression, awardDate);
  const xpUserStats = {
    streakDays: nextStreak,
    rollingAvgPaceSec: progression.rollingAvgPaceSec,
    awardedToday,
  };
  const { totalXp: xpEarned, breakdown } = computeXpFromActivity(
    activity,
    xpUserStats,
    userId,
  );
  const runSummary = runSummaryFromActivity(activity);
  const gainSegments = buildXpGainSegments(breakdown, activity, xpUserStats);

  const beforeTotalXp = progression.totalXp;
  const afterTotalXp = beforeTotalXp + xpEarned;
  const avgPaceSec = averagePaceSecondsPerMile(activity.records);

  if (xpEarned === 0) {
    return {
      xpEarned: 0,
      event: buildXpGainEvent(beforeTotalXp, 0, runSummary),
      progression,
      alreadyAwarded: false,
    };
  }

  const entry: XpLedgerEntry = {
    id: `${activityId}-${Date.now()}`,
    awardedAt: new Date().toISOString(),
    totalXp: xpEarned,
    source: 'run',
    sourceId: activityId,
    breakdown,
  };

  const nextProgression = await appendLedgerEntry(userId, entry, afterTotalXp, {
    streakDays: nextStreak,
    lastAwardDate: awardDate,
    rollingAvgPaceSec: nextRollingAvgPaceSec(progression.rollingAvgPaceSec, avgPaceSec),
  });

  return {
    xpEarned,
    event: buildXpGainEvent(beforeTotalXp, xpEarned, runSummary, gainSegments),
    progression: nextProgression,
    alreadyAwarded: false,
  };
}
