-- TEMPORARY (dev testing only): pull the active Runnas vs Lightning team
-- match's end time in to ~1 minute from now, so the countdown's sub-minute
-- per-second ticking and the Phase 4 finalize/completion drawer can be
-- exercised live without waiting until 2026-07-10. Revert via the paired
-- rollback, which restores the original ends_at captured before this change.

update public.matches
set ends_at = now() + interval '1 minute'
where id = '55679326-cbb8-4576-83e9-dd1e04ad8c8d'
  and kind = 'team'
  and status = 'active';
