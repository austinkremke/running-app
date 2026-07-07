-- Restore the original ends_at captured before the temporary 1-minute test override.
update public.matches
set ends_at = '2026-07-10 04:30:14.574634+00'
where id = '98f8910d-9b15-405e-954d-353f27331dc4'
  and kind = 'team';
