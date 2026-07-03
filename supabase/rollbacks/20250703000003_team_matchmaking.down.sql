-- Rollback: remove team matchmaking queue + RPCs.

drop function if exists public.get_team_matchmaking_status();
drop function if exists public.cancel_team_matchmaking();
drop function if exists public.enqueue_team_matchmaking(text);
drop function if exists public.team_active_match_id(uuid);
drop function if exists public.try_pair_team_queue();
drop function if exists public.enroll_team_roster(uuid, uuid, text);
drop function if exists public.team_min_roster_to_queue();

drop table if exists public.team_match_queue;
