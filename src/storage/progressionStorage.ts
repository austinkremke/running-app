import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_LEDGER_ENTRIES } from '../config/xpRewards';
import type { StoredProgression, XpLedgerEntry } from '../types/progression';

const PROGRESSION_KEY_PREFIX = '@runoff/progression:';

const EMPTY_PROGRESSION: StoredProgression = {
  totalXp: 0,
  ledger: [],
  streakDays: 0,
  rollingAvgPaceSec: null,
};

function progressionKey(userId: string): string {
  return `${PROGRESSION_KEY_PREFIX}${userId}`;
}

function normalizeProgression(raw: unknown): StoredProgression {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_PROGRESSION };
  }

  const value = raw as Partial<StoredProgression>;

  return {
    totalXp: typeof value.totalXp === 'number' ? Math.max(0, value.totalXp) : 0,
    ledger: Array.isArray(value.ledger) ? value.ledger.slice(0, MAX_LEDGER_ENTRIES) : [],
    streakDays: typeof value.streakDays === 'number' ? Math.max(0, value.streakDays) : 0,
    lastAwardDate: typeof value.lastAwardDate === 'string' ? value.lastAwardDate : undefined,
    rollingAvgPaceSec:
      typeof value.rollingAvgPaceSec === 'number' ? value.rollingAvgPaceSec : null,
  };
}

export async function readProgression(userId: string): Promise<StoredProgression> {
  const raw = await AsyncStorage.getItem(progressionKey(userId));
  if (!raw) {
    return { ...EMPTY_PROGRESSION };
  }

  try {
    return normalizeProgression(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PROGRESSION };
  }
}

export async function writeProgression(
  userId: string,
  progression: StoredProgression,
): Promise<void> {
  const payload: StoredProgression = {
    ...progression,
    ledger: progression.ledger.slice(0, MAX_LEDGER_ENTRIES),
  };

  await AsyncStorage.setItem(progressionKey(userId), JSON.stringify(payload));
}

export async function appendLedgerEntry(
  userId: string,
  entry: XpLedgerEntry,
  nextTotalXp: number,
  updates: Pick<StoredProgression, 'streakDays' | 'lastAwardDate' | 'rollingAvgPaceSec'>,
): Promise<StoredProgression> {
  const current = await readProgression(userId);
  const next: StoredProgression = {
    ...current,
    totalXp: nextTotalXp,
    ledger: [entry, ...current.ledger].slice(0, MAX_LEDGER_ENTRIES),
    streakDays: updates.streakDays,
    lastAwardDate: updates.lastAwardDate,
    rollingAvgPaceSec: updates.rollingAvgPaceSec,
  };

  await writeProgression(userId, next);
  return next;
}
