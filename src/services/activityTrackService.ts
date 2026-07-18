import type { ActivityRecord } from '../types/activity';
import { supabase } from './supabase';

type StoredTrack = {
  records?: ActivityRecord[];
};

/**
 * Downloads and parses the raw per-point track uploaded alongside an activity
 * row. Fetches via a signed URL rather than the SDK's `storage.download()`,
 * which constructs a Blob from an ArrayBuffer internally — unsupported by
 * React Native's Blob polyfill.
 */
export async function fetchActivityTrack(
  trackStoragePath: string | null,
): Promise<ActivityRecord[]> {
  if (!supabase || !trackStoragePath) return [];

  const { data, error } = await supabase.storage
    .from('activities')
    .createSignedUrl(trackStoragePath, 60);
  if (error || !data?.signedUrl) return [];

  try {
    const response = await fetch(data.signedUrl);
    if (!response.ok) return [];
    const parsed = (await response.json()) as StoredTrack;
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    return [];
  }
}
