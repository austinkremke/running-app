-- Schedules the deliver-notifications Edge Function to run every minute via
-- pg_cron + pg_net. The Authorization header uses the anon key — already
-- public in the client bundle, so no sensitive value lives in this
-- migration. The function itself always operates with the service role
-- internally regardless of caller identity; the anon key here is only the
-- Supabase gateway's "is this a request I should route" check.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'deliver-notifications-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://ogqqppieovuauyuixvaa.supabase.co/functions/v1/deliver-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_bD8PY2VEnuxf91LmEavd3w_71lCRdxV'
    ),
    body := '{}'::jsonb
  );
  $$
);
