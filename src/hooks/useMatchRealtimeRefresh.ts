import { useEffect, useRef } from 'react';

import { supabase } from '../services/supabase';

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

    const client = supabase;
    const channel = client
      .channel(`match-live:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'match_participants',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          onRefreshRef.current();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          onRefreshRef.current();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        () => {
          onRefreshRef.current();
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [enabled, matchId]);
}
