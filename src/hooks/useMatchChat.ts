import { useCallback, useEffect, useRef, useState } from 'react';

import type { TeamChatMessage } from '../mock';
import { useUserId } from '../context';
import {
  fetchMatchMessages,
  mapMatchMessageRow,
  sendMatchMessage,
  type MatchMessageRow,
} from '../services/matchChatService';
import { supabase } from '../services/supabase';

async function fetchMatchMessageById(messageId: string): Promise<MatchMessageRow | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('match_messages')
    .select(
      `
      id,
      match_id,
      user_id,
      body,
      created_at,
      profiles:user_id (display_name, avatar_url)
    `,
    )
    .eq('id', messageId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as MatchMessageRow | null) ?? null;
}

export function useMatchChat(matchId: string | null, enabled: boolean) {
  const userId = useUserId();
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdsRef = useRef(new Set<string>());

  const appendRows = useCallback(
    (rows: MatchMessageRow[]) => {
      if (rows.length === 0) {
        return;
      }

      setMessages((current) => {
        const next = [...current];
        for (const row of rows) {
          if (messageIdsRef.current.has(row.id)) {
            continue;
          }
          messageIdsRef.current.add(row.id);
          next.push(mapMatchMessageRow(row, userId));
        }
        return next;
      });
    },
    [userId],
  );

  const loadMessages = useCallback(async () => {
    if (!matchId) {
      messageIdsRef.current.clear();
      setMessages([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await fetchMatchMessages(matchId);
      messageIdsRef.current.clear();
      setMessages([]);
      appendRows(rows);
    } catch (loadError) {
      messageIdsRef.current.clear();
      setMessages([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not load chat.');
    } finally {
      setLoading(false);
    }
  }, [appendRows, matchId]);

  useEffect(() => {
    if (!enabled || !matchId) {
      messageIdsRef.current.clear();
      setMessages([]);
      setError(null);
      setLoading(false);
      return;
    }

    void loadMessages();
  }, [enabled, loadMessages, matchId]);

  useEffect(() => {
    if (!enabled || !supabase || !matchId) {
      return;
    }

    const client = supabase;
    const channel = client
      .channel(`match-chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const messageId = (payload.new as { id?: string }).id;
          if (!messageId || messageIdsRef.current.has(messageId)) {
            return;
          }

          void fetchMatchMessageById(messageId)
            .then((row) => {
              if (row) {
                appendRows([row]);
              }
            })
            .catch(() => undefined);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [appendRows, enabled, matchId]);

  const send = useCallback(
    async (body: string) => {
      if (!matchId || !userId || sending) {
        return;
      }

      setSending(true);
      setError(null);

      try {
        await sendMatchMessage(matchId, userId, body);
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : 'Could not send message.');
      } finally {
        setSending(false);
      }
    },
    [matchId, sending, userId],
  );

  return {
    messages,
    loading,
    sending,
    error,
    send,
    reload: loadMessages,
  };
}
