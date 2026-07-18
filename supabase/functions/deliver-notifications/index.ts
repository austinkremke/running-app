// Drains public.notification_events: pulls due 'pending' rows, joins each
// user's device tokens + preferences, and batches sends to the Expo Push
// API. Preference/token checks happen HERE (delivery time), not when the
// event is enqueued, so toggling a category off suppresses already-queued
// rows too. Invoked on a schedule (pg_cron + pg_net) — not by clients.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;
const PULL_LIMIT = 500;

type NotificationEvent = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  message?: string;
};

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: events, error: fetchError } = await admin
    .from('notification_events')
    .select('id, user_id, category, title, body, data')
    .eq('status', 'pending')
    .lte('deliver_at', new Date().toISOString())
    .order('deliver_at', { ascending: true })
    .limit(PULL_LIMIT);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  const pending = (events ?? []) as NotificationEvent[];
  if (pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  const userIds = [...new Set(pending.map((event) => event.user_id))];

  const { data: prefRows } = await admin
    .from('notification_preferences')
    .select('*')
    .in('user_id', userIds);
  const prefsByUser = new Map((prefRows ?? []).map((row) => [row.user_id as string, row]));

  const { data: tokenRows } = await admin
    .from('device_push_tokens')
    .select('user_id, expo_token')
    .in('user_id', userIds);
  const tokensByUser = new Map<string, string[]>();
  for (const row of tokenRows ?? []) {
    const list = tokensByUser.get(row.user_id as string) ?? [];
    list.push(row.expo_token as string);
    tokensByUser.set(row.user_id as string, list);
  }

  const skippedIds: string[] = [];
  const sendable: { event: NotificationEvent; tokens: string[] }[] = [];

  for (const event of pending) {
    const prefs = prefsByUser.get(event.user_id);
    const categoryEnabled = prefs ? prefs[event.category as keyof typeof prefs] !== false : true;
    const tokens = tokensByUser.get(event.user_id) ?? [];

    if (!categoryEnabled || tokens.length === 0) {
      skippedIds.push(event.id);
      continue;
    }

    sendable.push({ event, tokens });
  }

  if (skippedIds.length > 0) {
    await admin
      .from('notification_events')
      .update({ status: 'skipped' })
      .in('id', skippedIds);
  }

  type PushMessage = {
    eventId: string;
    to: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    sound: 'default';
  };

  const messages: PushMessage[] = sendable.flatMap(({ event, tokens }) =>
    tokens.map((token) => ({
      eventId: event.id,
      to: token,
      title: event.title,
      body: event.body,
      data: { ...event.data, category: event.category, notification_event_id: event.id },
      sound: 'default' as const,
    })),
  );

  const sentIds = new Set<string>();
  const failedIds = new Set<string>();

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const batchEventIds = [...new Set(batch.map((message) => message.eventId))];
    const payload = batch.map(({ eventId: _eventId, ...message }) => message);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { data?: ExpoPushTicket[] };
      const tickets = result.data ?? [];
      const allOk = tickets.length > 0 && tickets.every((ticket) => ticket.status === 'ok');

      for (const eventId of batchEventIds) {
        (allOk ? sentIds : failedIds).add(eventId);
      }
    } catch {
      for (const eventId of batchEventIds) {
        failedIds.add(eventId);
      }
    }
  }

  if (sentIds.size > 0) {
    await admin
      .from('notification_events')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .in('id', [...sentIds]);
  }

  if (failedIds.size > 0) {
    await admin
      .from('notification_events')
      .update({ status: 'failed' })
      .in('id', [...failedIds]);
  }

  return new Response(
    JSON.stringify({
      processed: pending.length,
      sent: sentIds.size,
      failed: failedIds.size,
      skipped: skippedIds.length,
    }),
    { status: 200 },
  );
});
