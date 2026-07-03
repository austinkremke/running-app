-- Milestone 07: team invites & join requests (unified notifications).
-- One table, two directions:
--   kind = 'invite'  → leader/co-leader invites a user; the user accepts/declines
--   kind = 'request' → a user asks to join; leaders/co-leaders accept/decline
-- user_id is always the prospective member; created_by is the initiator.

create table public.team_membership_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  kind text not null check (kind in ('invite', 'request')),
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

-- One pending invite/request per (team, user) — prevents duplicate spam either direction.
create unique index team_membership_requests_pending_idx
  on public.team_membership_requests (team_id, user_id)
  where status = 'pending';

create index team_membership_requests_user_pending_idx
  on public.team_membership_requests (user_id)
  where status = 'pending';

create index team_membership_requests_team_pending_idx
  on public.team_membership_requests (team_id)
  where status = 'pending';

alter table public.team_membership_requests enable row level security;

-- Readable by the prospective member and by the team's leaders/co-leaders.
create policy "team_membership_requests_select_relevant"
  on public.team_membership_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.team_role_for(team_id, auth.uid()) in ('leader', 'co-leader')
  );

create trigger team_membership_requests_set_updated_at
  before update on public.team_membership_requests
  for each row execute function public.set_updated_at();

-- Expire stale pending rows (called at the top of every RPC below).
create or replace function public.expire_stale_team_membership_requests()
returns void
language sql
security definer
set search_path = public
as $$
  update public.team_membership_requests
    set status = 'expired'
    where status = 'pending' and expires_at <= now();
$$;

-- Shared join step: add prospective member, then clear their other pending rows.
create or replace function public.finalize_team_membership_join(
  p_team_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_max int;
begin
  if exists (select 1 from public.team_members where user_id = p_user_id) then
    raise exception 'That runner is already on a team';
  end if;

  select count(*), max(t.member_max)
    into v_count, v_max
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.team_id = p_team_id;

  if v_count >= coalesce(v_max, (select member_max from public.teams where id = p_team_id)) then
    raise exception 'Team is full';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (p_team_id, p_user_id, 'member');

  -- The new member no longer needs any other pending invites/requests.
  update public.team_membership_requests
    set status = 'cancelled'
    where user_id = p_user_id
      and status = 'pending'
      and not (team_id = p_team_id);
end;
$$;

create or replace function public.invite_to_team(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_team_id uuid;
  v_role text;
  v_request public.team_membership_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id = v_actor then
    raise exception 'You are already on this team';
  end if;

  select team_id, role into v_team_id, v_role
    from public.team_members where user_id = v_actor;

  if v_team_id is null or v_role not in ('leader', 'co-leader') then
    raise exception 'Only team leaders can invite members';
  end if;

  perform public.expire_stale_team_membership_requests();

  if exists (select 1 from public.team_members where user_id = p_user_id) then
    raise exception 'That runner is already on a team';
  end if;

  -- A pending join request from this user is auto-accepted by inviting them.
  select * into v_request
    from public.team_membership_requests
    where team_id = v_team_id and user_id = p_user_id
      and kind = 'request' and status = 'pending'
    limit 1;

  if found then
    update public.team_membership_requests
      set status = 'accepted' where id = v_request.id;
    perform public.finalize_team_membership_join(v_team_id, p_user_id);
    return jsonb_build_object('status', 'joined', 'team_id', v_team_id);
  end if;

  if exists (
    select 1 from public.team_membership_requests
    where team_id = v_team_id and user_id = p_user_id and status = 'pending'
  ) then
    return jsonb_build_object('status', 'already_pending');
  end if;

  insert into public.team_membership_requests (team_id, kind, user_id, created_by)
  values (v_team_id, 'invite', p_user_id, v_actor)
  returning * into v_request;

  return jsonb_build_object('status', 'invited', 'request_id', v_request.id);
end;
$$;

create or replace function public.request_to_join_team(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.team_membership_requests%rowtype;
  v_count int;
  v_max int;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.team_members where user_id = v_actor) then
    raise exception 'Leave your current team before requesting to join another';
  end if;

  if not exists (select 1 from public.teams where id = p_team_id) then
    raise exception 'Team not found';
  end if;

  perform public.expire_stale_team_membership_requests();

  select count(*), max(t.member_max) into v_count, v_max
    from public.teams t
    left join public.team_members tm on tm.team_id = t.id
    where t.id = p_team_id
    group by t.id;

  if v_count >= v_max then
    raise exception 'Team is full';
  end if;

  -- A pending invite for this team means we can just accept it.
  select * into v_request
    from public.team_membership_requests
    where team_id = p_team_id and user_id = v_actor
      and kind = 'invite' and status = 'pending'
    limit 1;

  if found then
    update public.team_membership_requests set status = 'accepted' where id = v_request.id;
    perform public.finalize_team_membership_join(p_team_id, v_actor);
    return jsonb_build_object('status', 'joined', 'team_id', p_team_id);
  end if;

  if exists (
    select 1 from public.team_membership_requests
    where team_id = p_team_id and user_id = v_actor and status = 'pending'
  ) then
    return jsonb_build_object('status', 'already_pending');
  end if;

  insert into public.team_membership_requests (team_id, kind, user_id, created_by)
  values (p_team_id, 'request', v_actor, v_actor)
  returning * into v_request;

  return jsonb_build_object('status', 'requested', 'request_id', v_request.id);
end;
$$;

create or replace function public.respond_to_team_invite(p_request_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.team_membership_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
    from public.team_membership_requests where id = p_request_id for update;

  if not found or v_request.kind <> 'invite' or v_request.user_id <> v_actor then
    raise exception 'Invite not found';
  end if;

  if v_request.status <> 'pending' then
    return jsonb_build_object('status', v_request.status);
  end if;

  if not p_accept then
    update public.team_membership_requests set status = 'declined' where id = p_request_id;
    return jsonb_build_object('status', 'declined');
  end if;

  update public.team_membership_requests set status = 'accepted' where id = p_request_id;
  perform public.finalize_team_membership_join(v_request.team_id, v_actor);
  return jsonb_build_object('status', 'joined', 'team_id', v_request.team_id);
end;
$$;

create or replace function public.respond_to_join_request(p_request_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.team_membership_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
    from public.team_membership_requests where id = p_request_id for update;

  if not found or v_request.kind <> 'request' then
    raise exception 'Request not found';
  end if;

  if public.team_role_for(v_request.team_id, v_actor) not in ('leader', 'co-leader') then
    raise exception 'Only team leaders can respond to join requests';
  end if;

  if v_request.status <> 'pending' then
    return jsonb_build_object('status', v_request.status);
  end if;

  if not p_accept then
    update public.team_membership_requests set status = 'declined' where id = p_request_id;
    return jsonb_build_object('status', 'declined');
  end if;

  update public.team_membership_requests set status = 'accepted' where id = p_request_id;
  perform public.finalize_team_membership_join(v_request.team_id, v_request.user_id);
  return jsonb_build_object('status', 'joined', 'team_id', v_request.team_id);
end;
$$;

create or replace function public.cancel_team_membership_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.team_membership_requests%rowtype;
  v_can_cancel boolean;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
    from public.team_membership_requests where id = p_request_id for update;

  if not found then
    raise exception 'Request not found';
  end if;

  -- Initiator can withdraw; leaders can also rescind invites their team sent.
  v_can_cancel :=
    v_request.created_by = v_actor
    or (v_request.kind = 'invite'
        and public.team_role_for(v_request.team_id, v_actor) in ('leader', 'co-leader'));

  if not v_can_cancel then
    raise exception 'You cannot cancel this request';
  end if;

  if v_request.status = 'pending' then
    update public.team_membership_requests set status = 'cancelled' where id = p_request_id;
  end if;

  return jsonb_build_object('status', 'cancelled');
end;
$$;

-- Pending items relevant to the caller: invites addressed to them + join
-- requests for teams they lead. `actor` is the person to feature in the UI.
create or replace function public.get_team_notifications()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(item order by item->>'created_at' desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', r.id,
      'kind', r.kind,
      'team_id', t.id,
      'team_name', t.name,
      'team_tag', t.tag,
      'team_logo_icon', t.logo_icon,
      'team_logo_accent', t.logo_accent,
      'actor_id', actor.id,
      'actor_name', actor.display_name,
      'actor_avatar_url', actor.avatar_url,
      'actor_level', public.level_from_total_xp(coalesce(pp.total_xp, 0)::bigint),
      'created_at', r.created_at
    ) as item
    from public.team_membership_requests r
    join public.teams t on t.id = r.team_id
    -- For an invite (shown to the invited user) feature the inviter; for a
    -- request (shown to leaders) feature the requester.
    join public.profiles actor
      on actor.id = case when r.kind = 'invite' then r.created_by else r.user_id end
    left join public.player_progress pp on pp.user_id = actor.id
    where r.status = 'pending'
      and (
        (r.kind = 'invite' and r.user_id = auth.uid())
        or (r.kind = 'request'
            and public.team_role_for(r.team_id, auth.uid()) in ('leader', 'co-leader'))
      )
  ) items;
$$;

create or replace function public.has_team_notifications()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_membership_requests r
    where r.status = 'pending'
      and r.expires_at > now()
      and (
        (r.kind = 'invite' and r.user_id = auth.uid())
        or (r.kind = 'request'
            and public.team_role_for(r.team_id, auth.uid()) in ('leader', 'co-leader'))
      )
  );
$$;

revoke all on function public.expire_stale_team_membership_requests() from public;
revoke all on function public.finalize_team_membership_join(uuid, uuid) from public;
revoke all on function public.invite_to_team(uuid) from public;
revoke all on function public.request_to_join_team(uuid) from public;
revoke all on function public.respond_to_team_invite(uuid, boolean) from public;
revoke all on function public.respond_to_join_request(uuid, boolean) from public;
revoke all on function public.cancel_team_membership_request(uuid) from public;
revoke all on function public.get_team_notifications() from public;
revoke all on function public.has_team_notifications() from public;

grant execute on function public.invite_to_team(uuid) to authenticated;
grant execute on function public.request_to_join_team(uuid) to authenticated;
grant execute on function public.respond_to_team_invite(uuid, boolean) to authenticated;
grant execute on function public.respond_to_join_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_team_membership_request(uuid) to authenticated;
grant execute on function public.get_team_notifications() to authenticated;
grant execute on function public.has_team_notifications() to authenticated;
