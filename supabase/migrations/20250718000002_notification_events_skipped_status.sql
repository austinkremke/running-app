-- Adds a 'skipped' status for events the worker deliberately doesn't send
-- (user turned that category off, or has no registered device) — distinct
-- from 'failed' (a real delivery error worth investigating/retrying).

alter table public.notification_events
  drop constraint notification_events_status_check;

alter table public.notification_events
  add constraint notification_events_status_check
  check (status in ('pending', 'sent', 'skipped', 'failed'));
