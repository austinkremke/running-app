import type { XpGainEvent, XpGainRunSummary } from '../../types/progression';
import type { StoredProgression, XpBreakdownLine, XpLedgerEntry } from '../../types/progression';
import type { StoredActivity } from '../../types/activity';
import type { Json } from '../../types/database';
import { supabase, isSupabaseConfigured } from '../supabase';
import { readProgression, appendLedgerEntry, writeProgression } from '../../storage/progressionStorage';
import { averagePaceSecondsPerMile } from '../activityMetrics';
import { buildXpGainEvent } from './buildXpGainEvent';
import { buildXpGainSegments } from './buildXpGainSegments';
import { computeXpFromActivity } from './xpCalculator';
import {
  awardRunXpOnServer,
  bootstrapProgressionOnServer,
  fetchServerProgression,
  runSummaryFromActivity,
} from './xpAwardService';

export type AwardRunXpResult = {
  xpEarned: number;
  event: XpGainEvent;
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

async function awardRunXpLocal(
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

export async function loadProgressionForUser(
  userId: string,
  serverTotalXp = 0,
): Promise<StoredProgression> {
  const local = await readProgression(userId);

  if (isSupabaseConfigured) {
    try {
      const server = await fetchServerProgression(userId);
      if (server) {
        if (server.totalXp === 0 && local.totalXp > 0) {
          const bootstrapped = await bootstrapProgressionOnServer(local);
          if (bootstrapped != null) {
            const merged: StoredProgression = {
              ...local,
              totalXp: bootstrapped,
            };
            return writeProgressionFromServer(userId, merged, {
              ...server,
              totalXp: bootstrapped,
            });
          }
        }

        const merged = mergeServerProgression(local, server);
        return writeProgressionFromServer(userId, merged, server);
      }
    } catch {
      // Fall back to local when offline or migration not applied yet.
    }
  }

  if (serverTotalXp > local.totalXp) {
    return {
      ...local,
      totalXp: serverTotalXp,
    };
  }

  return local;
}

function mergeServerProgression(
  local: StoredProgression,
  server: {
    totalXp: number;
    streakDays: number;
    lastAwardDate?: string;
    rollingAvgPaceSec: number | null;
  },
): StoredProgression {
  return {
    ...local,
    totalXp: Math.max(local.totalXp, server.totalXp),
    streakDays: server.totalXp >= local.totalXp ? server.streakDays : local.streakDays,
    lastAwardDate:
      server.totalXp >= local.totalXp ? server.lastAwardDate : local.lastAwardDate,
    rollingAvgPaceSec:
      server.totalXp >= local.totalXp
        ? server.rollingAvgPaceSec
        : local.rollingAvgPaceSec,
  };
}

async function writeProgressionFromServer(
  userId: string,
  progression: StoredProgression,
  server: {
    totalXp: number;
    streakDays: number;
    lastAwardDate?: string;
    rollingAvgPaceSec: number | null;
  },
): Promise<StoredProgression> {
  const next: StoredProgression = {
    ...progression,
    totalXp: Math.max(progression.totalXp, server.totalXp),
    streakDays: server.streakDays,
    lastAwardDate: server.lastAwardDate,
    rollingAvgPaceSec: server.rollingAvgPaceSec,
  };
  await writeProgression(userId, next);
  return next;
}

export async function awardRunXp(
  userId: string,
  activity: StoredActivity,
): Promise<AwardRunXpResult> {
  const progression = await readProgression(userId);

  if (isSupabaseConfigured) {
    try {
      const serverResult = await awardRunXpOnServer(userId, activity, progression);
      await writeProgression(userId, serverResult.progression);

      return {
        xpEarned: serverResult.xpEarned,
        event: serverResult.event,
        progression: serverResult.progression,
        alreadyAwarded: serverResult.alreadyAwarded,
      };
    } catch {
      // Migration not deployed or offline — fall back to local award path.
    }
  }

  return awardRunXpLocal(userId, activity);
}

export type { XpGainRunSummary };
