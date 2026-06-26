import type { XpGainEvent, XpGainRunSummary } from '../../types/progression';
import type { StoredProgression, XpBreakdownLine, XpLedgerEntry } from '../../types/progression';
import type { StoredActivity } from '../../types/activity';
import type { Json } from '../../types/database';
import { supabase } from '../supabase';
import { buildXpGainEvent } from './buildXpGainEvent';
import { buildXpGainSegments } from './buildXpGainSegments';
import type { XpUserStats } from './xpCalculator';

export type ServerAwardRunXpResult = {
  xpEarned: number;
  alreadyAwarded: boolean;
  beforeTotalXp: number;
  totalXp: number;
  breakdown: XpBreakdownLine[];
  progression: StoredProgression;
  event: XpGainEvent;
};

type AwardRunXpRpcRow = {
  xp_earned: number;
  already_awarded: boolean;
  before_total_xp: number;
  total_xp: number;
  breakdown: XpBreakdownLine[];
  streak_days: number;
  last_award_date: string | null;
  rolling_avg_pace_sec: number | null;
};

function parseBreakdown(value: Json | undefined): XpBreakdownLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((line) => {
    if (!line || typeof line !== 'object' || Array.isArray(line)) {
      return [];
    }

    const record = line as Record<string, Json | undefined>;
    const key = record.key;
    const label = record.label;
    const xp = record.xp;

    if (typeof key !== 'string' || typeof label !== 'string' || typeof xp !== 'number') {
      return [];
    }

    return [
      {
        key: key as XpBreakdownLine['key'],
        label,
        xp,
      },
    ];
  });
}

function parseAwardRpcRow(value: Json): AwardRunXpRpcRow {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid award_run_xp response.');
  }

  const row = value as Record<string, Json | undefined>;

  return {
    xp_earned: typeof row.xp_earned === 'number' ? row.xp_earned : 0,
    already_awarded: row.already_awarded === true,
    before_total_xp: typeof row.before_total_xp === 'number' ? row.before_total_xp : 0,
    total_xp: typeof row.total_xp === 'number' ? row.total_xp : 0,
    breakdown: parseBreakdown(row.breakdown),
    streak_days: typeof row.streak_days === 'number' ? row.streak_days : 0,
    last_award_date: typeof row.last_award_date === 'string' ? row.last_award_date : null,
    rolling_avg_pace_sec:
      typeof row.rolling_avg_pace_sec === 'number' ? row.rolling_avg_pace_sec : null,
  };
}

function progressionFromServer(
  row: AwardRunXpRpcRow,
  existingLedger: XpLedgerEntry[],
  activityId: string,
  xpEarned: number,
  breakdown: XpBreakdownLine[],
): StoredProgression {
  const nextLedger =
    xpEarned > 0
      ? [
          {
            id: `${activityId}-${Date.now()}`,
            awardedAt: new Date().toISOString(),
            totalXp: xpEarned,
            source: 'run' as const,
            sourceId: activityId,
            breakdown,
          },
          ...existingLedger,
        ]
      : existingLedger;

  return {
    totalXp: row.total_xp,
    ledger: nextLedger,
    streakDays: row.streak_days,
    lastAwardDate: row.last_award_date ?? undefined,
    rollingAvgPaceSec: row.rolling_avg_pace_sec,
  };
}

export function runSummaryFromActivity(activity: StoredActivity): XpGainRunSummary {
  const { summary } = activity;

  return {
    distance: `${summary.distanceMiles.toFixed(2)} mi`,
    duration: summary.duration,
    pace: `${summary.avgPace}${summary.avgPaceUnit}`,
  };
}

export async function awardRunXpOnServer(
  userId: string,
  activity: StoredActivity,
  existingProgression: StoredProgression,
): Promise<ServerAwardRunXpResult> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const activityId = activity.session.id;
  const { data, error } = await supabase.rpc('award_run_xp', {
    p_activity_id: activityId,
  });

  if (error) {
    throw error;
  }

  const row = parseAwardRpcRow(data);
  const runSummary = runSummaryFromActivity(activity);
  const xpUserStats: XpUserStats = {
    streakDays: row.streak_days,
    rollingAvgPaceSec: existingProgression.rollingAvgPaceSec,
    awardedToday: existingProgression.lastAwardDate === row.last_award_date,
  };
  const gainSegments = buildXpGainSegments(row.breakdown, activity, {
    ...xpUserStats,
    streakDays: row.xp_earned > 0 ? row.streak_days : existingProgression.streakDays,
    rollingAvgPaceSec:
      row.rolling_avg_pace_sec ?? existingProgression.rollingAvgPaceSec,
  });

  const progression = progressionFromServer(
    row,
    existingProgression.ledger,
    activityId,
    row.xp_earned,
    row.breakdown,
  );

  return {
    xpEarned: row.xp_earned,
    alreadyAwarded: row.already_awarded,
    beforeTotalXp: row.before_total_xp,
    totalXp: row.total_xp,
    breakdown: row.breakdown,
    progression,
    event: buildXpGainEvent(
      row.before_total_xp,
      row.xp_earned,
      runSummary,
      gainSegments,
    ),
  };
}

export async function bootstrapProgressionOnServer(
  progression: StoredProgression,
): Promise<number | null> {
  if (!supabase || progression.totalXp <= 0) {
    return null;
  }

  const { data, error } = await supabase.rpc('bootstrap_progression_from_local', {
    p_total_xp: progression.totalXp,
    p_streak_days: progression.streakDays,
    p_last_award_date: progression.lastAwardDate ?? undefined,
    p_rolling_avg_pace_sec: progression.rollingAvgPaceSec ?? undefined,
  });

  if (error) {
    throw error;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const row = data as Record<string, Json | undefined>;
  if (row.bootstrapped === true && typeof row.total_xp === 'number') {
    return row.total_xp;
  }

  return null;
}

export async function fetchServerProgression(userId: string): Promise<{
  totalXp: number;
  streakDays: number;
  lastAwardDate?: string;
  rollingAvgPaceSec: number | null;
} | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('player_progress')
    .select('total_xp, streak_days, last_award_date, rolling_avg_pace_sec')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    totalXp: data.total_xp,
    streakDays: data.streak_days,
    lastAwardDate: data.last_award_date ?? undefined,
    rollingAvgPaceSec: data.rolling_avg_pace_sec,
  };
}
