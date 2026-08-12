import { useEffect, useRef } from 'react';

import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const TAG = '[useMatchRealtimeRefresh]';

type Entry = {
  channel: RealtimeChannel;
  refCount: number;
  listeners: Set<() => void>;
  teardownTimer: ReturnType<typeof setTimeout> | null;
};

const entries = new Map<string, Entry>();

function getEntry(matchId: string): Entry {
  const existing = entries.get(matchId);
  if (existing) {
    console.log(`${TAG} reusing entry for ${matchId}, refCount=${existing.refCount}`);
    return existing;
  }

  const listeners = new Set<() => void>();
  const notify = () => {
    console.log(`${TAG} notify for ${matchId}, listeners=${listeners.size}`);
    listeners.forEach((listener) => listener());
  };

  const client = supabase;
  if (!client) {
    throw new Error('Supabase client is not configured.');
  }

  console.log(`${TAG} creating channel for ${matchId}`);
  let channel: RealtimeChannel;
  try {
    channel = client
      .channel(`match-live:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'match_participants',
          filter: `match_id=eq.${matchId}`,
        },
        notify,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `match_id=eq.${matchId}`,
        },
        notify,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        notify,
      )
      .subscribe((status, err) => {
        console.log(`${TAG} subscribe status for ${matchId}: ${status}`, err ?? '');
      });
  } catch (error) {
    console.error(`${TAG} failed to create/subscribe channel for ${matchId}:`, error);
    throw error;
  }

  const entry: Entry = { channel, refCount: 0, listeners, teardownTimer: null };
  entries.set(matchId, entry);
  return entry;
}

export function useMatchRealtimeRefresh(
  matchId: string | null,
  onRefresh: () => void,
  enabled = true,
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled || !supabase || !matchId) {
      return;
    }

    console.log(`${TAG} mount for ${matchId}, enabled=${enabled}`);
    const entry = getEntry(matchId);
    if (entry.teardownTimer) {
      console.log(`${TAG} cancelling pending teardown for ${matchId}`);
      clearTimeout(entry.teardownTimer);
      entry.teardownTimer = null;
    }
    const listener = () => onRefreshRef.current();
    entry.listeners.add(listener);
    entry.refCount += 1;
    console.log(`${TAG} refCount for ${matchId} -> ${entry.refCount}`);

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      console.log(`${TAG} unmount for ${matchId}, refCount -> ${entry.refCount}`);
      if (entry.refCount <= 0 && entry.teardownTimer === null) {
        console.log(`${TAG} scheduling teardown for ${matchId}`);
        entry.teardownTimer = setTimeout(() => {
          if (entries.get(matchId) === entry && entry.refCount <= 0) {
            console.log(`${TAG} tearing down channel for ${matchId}`);
            entries.delete(matchId);
            void supabase?.removeChannel(entry.channel);
          } else {
            console.log(`${TAG} teardown for ${matchId} aborted, entry reused`);
          }
        }, 0);
      }
    };
  }, [enabled, matchId]);
}
