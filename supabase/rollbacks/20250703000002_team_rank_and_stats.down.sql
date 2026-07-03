-- Rollback: remove team rating, overview/top-teams RPCs, and provisioning trigger.

drop function if exists public.list_top_teams(int);
drop function if exists public.get_team_overview(uuid);
drop function if exists public.apply_team_elo_match_result_system(uuid, uuid, int);

drop trigger if exists teams_provision_team_rank on public.teams;
drop function if exists public.provision_team_rank();

drop table if exists public.team_rank;
