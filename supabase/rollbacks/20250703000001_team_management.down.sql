-- Rollback: remove team management RPCs and leave-rule triggers; deactivate create_team gate.

drop function if exists public.disband_team();
drop function if exists public.transfer_leadership(uuid);
drop function if exists public.kick_member(uuid);
drop function if exists public.demote_member(uuid);
drop function if exists public.promote_member(uuid);
drop function if exists public.update_team(uuid, text, text, text, text);
drop function if exists public.create_team(text, text, text, text, text);
drop function if exists public.team_has_active_match(uuid);
drop function if exists public.team_role_for(uuid, uuid);

drop trigger if exists team_members_disband_empty_team on public.team_members;
drop function if exists public.disband_empty_team();
drop trigger if exists team_members_leader_succession on public.team_members;
drop function if exists public.promote_successor_on_leader_leave();

update public.feature_gates
  set is_active = false
  where feature_id = 'create_team';
