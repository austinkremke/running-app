-- Revert the temporary min-roster-1 testing override back to the real rule (2).

create or replace function public.team_min_roster_to_queue()
returns int
language sql
immutable
as $$ select 2; $$;
