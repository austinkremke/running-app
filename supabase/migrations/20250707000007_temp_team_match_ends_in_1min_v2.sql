-- TEMPORARY (dev testing only): pull the current active Runnas vs Lightning
-- team match's end time in to ~1 minute from now, for live testing of the
-- countdown + Phase 4 finalize/completion flow. Revert via the paired
-- rollback, which restores the original ends_at captured before this change.

update public.matches
set ends_at = now() + interval '1 minute'
where id = '98f8910d-9b15-405e-954d-353f27331dc4'
  and kind = 'team'
  and status = 'active';
