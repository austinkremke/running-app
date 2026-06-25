import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_SYNC_KEY = '@runs/pending-sync';

export async function readPendingActivitySyncIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as string[];
}

export async function markActivityPendingSync(activityId: string): Promise<void> {
  const pending = await readPendingActivitySyncIds();
  if (pending.includes(activityId)) return;
  await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([activityId, ...pending]));
}

export async function clearActivityPendingSync(activityId: string): Promise<void> {
  const pending = await readPendingActivitySyncIds();
  const next = pending.filter((id) => id !== activityId);
  if (next.length === pending.length) return;
  await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(next));
}
