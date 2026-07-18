alter table public.notification_events
  drop constraint notification_events_status_check;

alter table public.notification_events
  add constraint notification_events_status_check
  check (status in ('pending', 'sent', 'failed'));
