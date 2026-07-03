-- Rollback: remove team invites/join-requests.

drop function if exists public.has_team_notifications();
drop function if exists public.get_team_notifications();
drop function if exists public.cancel_team_membership_request(uuid);
drop function if exists public.respond_to_join_request(uuid, boolean);
drop function if exists public.respond_to_team_invite(uuid, boolean);
drop function if exists public.request_to_join_team(uuid);
drop function if exists public.invite_to_team(uuid);
drop function if exists public.finalize_team_membership_join(uuid, uuid);
drop function if exists public.expire_stale_team_membership_requests();

drop table if exists public.team_membership_requests;
