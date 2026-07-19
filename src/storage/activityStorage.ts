import AsyncStorage from '@react-native-async-storage/async-storage';

import { recordsFromGpsPoints } from '../services/activityAdapters';
import { buildPostRunSummary } from '../services/buildPostRunSummary';
import type { GpsPoint } from '../maps/types';
import type { ActivitySession, ActivitySource, StoredActivity } from '../types/activity';

const INDEX_KEY = '@runs/index';
const runKey = (id: string) => `@runs/${id}`;

type LegacyStoredRun = {
  session: Omit<ActivitySession, 'source'> & { source?: string };
  points?: GpsPoint[];
  records?: StoredActivity['records'];
  summary: StoredActivity['summary'];
};

async function readIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as string[];
}

async function writeIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

function normalizeSession(session: LegacyStoredRun['session']): ActivitySession {
  // Legacy local storage — source is untyped JSON.parse output, not a checked ActivitySource.
  const source = (session.source === 'gps' ? 'phone-gps' : session.source) as ActivitySource;
  return { ...session, source };
}

function normalizeStoredActivity(raw: LegacyStoredRun): StoredActivity {
  const session = normalizeSession(raw.session);

  if (raw.records && raw.records.length > 0) {
    return {
      session,
      records: raw.records,
      summary: raw.summary,
    };
  }

  if (raw.points && raw.points.length > 0) {
    const records = recordsFromGpsPoints(raw.points, session.startedAt, session.source);
    return {
      session,
      records,
      summary: raw.summary,
    };
  }

  return {
    session,
    records: [],
    summary: raw.summary,
  };
}

export async function saveActivity(activity: StoredActivity): Promise<void> {
  const ids = await readIndex();
  const nextIds = [activity.session.id, ...ids.filter((id) => id !== activity.session.id)];
  await Promise.all([
    AsyncStorage.setItem(runKey(activity.session.id), JSON.stringify(activity)),
    writeIndex(nextIds),
  ]);
}

/** @deprecated Use saveActivity */
export const saveRun = saveActivity;

export async function getActivity(id: string): Promise<StoredActivity | null> {
  const raw = await AsyncStorage.getItem(runKey(id));
  if (!raw) return null;
  return normalizeStoredActivity(JSON.parse(raw) as LegacyStoredRun);
}

/** @deprecated Use getActivity */
export const getRun = getActivity;

export async function listActivities(): Promise<StoredActivity[]> {
  const ids = await readIndex();
  const activities = await Promise.all(ids.map((id) => getActivity(id)));
  return activities.filter((activity): activity is StoredActivity => activity != null);
}

/** @deprecated Use listActivities */
export const listRuns = listActivities;

export async function deleteActivity(id: string): Promise<void> {
  const ids = await readIndex();
  await Promise.all([
    AsyncStorage.removeItem(runKey(id)),
    writeIndex(ids.filter((existingId) => existingId !== id)),
  ]);
}

/** @deprecated Use deleteActivity */
export const deleteRun = deleteActivity;
