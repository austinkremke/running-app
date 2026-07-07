-- TEMPORARY (dev testing only): lower the minimum roster to queue a team
-- match from 2 to 1, so a solo-member team can queue against another
-- solo-member team on a second device. Revert via the paired rollback
-- once two-phone testing is done — the real min-roster-2 rule (see
-- milestones/07-team-play.md open decisions) should not ship to prod.

create or replace function public.team_min_roster_to_queue()
returns int
language sql
immutable
as $$ select 1; $$;
