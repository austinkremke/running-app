-- Restore the original ends_at captured before the temporary 1-minute test override.
update public.matches
set ends_at = '2026-07-10 03:28:32.525157+00'
where id = '55679326-cbb8-4576-83e9-dd1e04ad8c8d'
  and kind = 'team';
