-- Milestone 07 Phase 1: team creation & management.
-- All management writes go through security definer RPCs (teams has no client
-- write policies; team_members role changes have no update policy). Leave rules
-- enforced by triggers so the existing direct-delete leave path stays valid.

-- Activate the create_team gate now that the feature ships (seeded inactive in 06 Phase 4).
update public.feature_gates
  set is_active = true
  where feature_id = 'create_team';

-- Leader departure auto-promotes a successor (longest-tenured co-leader, else
-- longest-tenured member). Row-level so it also covers the delete_own_account
-- cascade — a leader deleting their account never bricks or blocks the team.
-- Explicit transfer_leadership remains the in-app path.
create or replace function public.promote_successor_on_leader_leave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_successor uuid;
begin
  if old.role = 'leader' then
    select user_id
      into v_successor
      from public.team_members
      where team_id = old.team_id
        and user_id <> old.user_id
      order by case role when 'co-leader' then 0 else 1 end, joined_at asc
      limit 1;

    if v_successor is not null then
      update public.team_members
        set role = 'leader'
        where team_id = old.team_id
          and user_id = v_successor;
    end if;
  end if;

  return old;
end;
$$;

create trigger team_members_leader_succession
  before delete on public.team_members
  for each row execute function public.promote_successor_on_leader_leave();

-- Last member out disbands the team (covers normal leave and the disband RPC).
create or replace function public.disband_empty_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.team_members where team_id = old.team_id
  ) then
    delete from public.teams where id = old.team_id;
  end if;

  return old;
end;
$$;

create trigger team_members_disband_empty_team
  after delete on public.team_members
  for each row execute function public.disband_empty_team();

create or replace function public.team_role_for(p_team_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.team_members
  where team_id = p_team_id
    and user_id = p_user_id;
$$;

create or replace function public.team_has_active_match(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches
    where kind = 'team'
      and status = 'active'
      and p_team_id in (home_team_id, away_team_id)
  );
$$;

create or replace function public.create_team(
  p_name text,
  p_tag text,
  p_motto text default '',
  p_logo_icon text default 'paw',
  p_logo_accent text default 'lime'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := trim(coalesce(p_name, ''));
  v_tag text := upper(trim(coalesce(p_tag, '')));
  v_team public.teams%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_feature_gate('create_team', v_user_id);

  if exists (select 1 from public.team_members where user_id = v_user_id) then
    raise exception 'Leave your current team before creating a new one';
  end if;

  if length(v_name) < 3 or length(v_name) > 24 then
    raise exception 'Team name must be 3-24 characters';
  end if;

  if v_tag !~ '^[A-Z0-9]{2,5}$' then
    raise exception 'Team tag must be 2-5 letters or numbers';
  end if;

  if length(coalesce(p_motto, '')) > 80 then
    raise exception 'Motto must be 80 characters or fewer';
  end if;

  if exists (select 1 from public.teams where tag = v_tag) then
    raise exception 'Team tag % is already taken', v_tag;
  end if;

  insert into public.teams (name, tag, motto, logo_icon, logo_accent)
  values (v_name, v_tag, coalesce(p_motto, ''), coalesce(p_logo_icon, 'paw'), coalesce(p_logo_accent, 'lime'))
  returning * into v_team;

  insert into public.team_members (team_id, user_id, role)
  values (v_team.id, v_user_id, 'leader');

  return jsonb_build_object('team_id', v_team.id, 'tag', v_team.tag);
end;
$$;

create or replace function public.update_team(
  p_team_id uuid,
  p_name text default null,
  p_motto text default null,
  p_logo_icon text default null,
  p_logo_accent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text := public.team_role_for(p_team_id, v_user_id);
  v_name text := trim(coalesce(p_name, ''));
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_role not in ('leader', 'co-leader') then
    raise exception 'Only leaders can edit the team';
  end if;

  if p_name is not null and (length(v_name) < 3 or length(v_name) > 24) then
    raise exception 'Team name must be 3-24 characters';
  end if;

  if p_motto is not null and length(p_motto) > 80 then
    raise exception 'Motto must be 80 characters or fewer';
  end if;

  update public.teams
    set name = coalesce(nullif(v_name, ''), name),
        motto = coalesce(p_motto, motto),
        logo_icon = coalesce(p_logo_icon, logo_icon),
        logo_accent = coalesce(p_logo_accent, logo_accent)
    where id = p_team_id;
end;
$$;

create or replace function public.promote_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.team_members%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_member from public.team_members where user_id = p_user_id;

  if not found or public.team_role_for(v_member.team_id, v_user_id) <> 'leader' then
    raise exception 'Only the leader can promote members';
  end if;

  if v_member.role <> 'member' then
    raise exception 'Only members can be promoted to co-leader';
  end if;

  update public.team_members
    set role = 'co-leader'
    where team_id = v_member.team_id
      and user_id = p_user_id;
end;
$$;

create or replace function public.demote_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.team_members%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_member from public.team_members where user_id = p_user_id;

  if not found or public.team_role_for(v_member.team_id, v_user_id) <> 'leader' then
    raise exception 'Only the leader can demote co-leaders';
  end if;

  if v_member.role <> 'co-leader' then
    raise exception 'Only co-leaders can be demoted';
  end if;

  update public.team_members
    set role = 'member'
    where team_id = v_member.team_id
      and user_id = p_user_id;
end;
$$;

create or replace function public.kick_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.team_members%rowtype;
  v_actor_role text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id = v_user_id then
    raise exception 'Leave the team instead of kicking yourself';
  end if;

  select * into v_member from public.team_members where user_id = p_user_id;

  if not found then
    raise exception 'Member not found';
  end if;

  v_actor_role := public.team_role_for(v_member.team_id, v_user_id);

  if v_actor_role not in ('leader', 'co-leader') then
    raise exception 'Only leaders can remove members';
  end if;

  if v_member.role = 'leader' then
    raise exception 'The leader cannot be removed';
  end if;

  if v_actor_role = 'co-leader' and v_member.role <> 'member' then
    raise exception 'Co-leaders can only remove members';
  end if;

  delete from public.team_members
    where team_id = v_member.team_id
      and user_id = p_user_id;
end;
$$;

create or replace function public.transfer_leadership(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.team_members%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id = v_user_id then
    raise exception 'You are already the leader';
  end if;

  select * into v_member from public.team_members where user_id = p_user_id;

  if not found or public.team_role_for(v_member.team_id, v_user_id) <> 'leader' then
    raise exception 'Only the leader can transfer leadership';
  end if;

  update public.team_members
    set role = 'leader'
    where team_id = v_member.team_id
      and user_id = p_user_id;

  update public.team_members
    set role = 'co-leader'
    where team_id = v_member.team_id
      and user_id = v_user_id;
end;
$$;

create or replace function public.disband_team()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_team_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select team_id into v_team_id
    from public.team_members
    where user_id = v_user_id
      and role = 'leader';

  if v_team_id is null then
    raise exception 'Only the leader can disband the team';
  end if;

  if public.team_has_active_match(v_team_id) then
    raise exception 'Finish the active team match before disbanding';
  end if;

  -- Members first so the succession trigger has no one to promote, then the
  -- leader; the empty-team trigger removes the team row after the last delete.
  delete from public.team_members
    where team_id = v_team_id
      and user_id <> v_user_id;

  delete from public.team_members
    where team_id = v_team_id
      and user_id = v_user_id;
end;
$$;

revoke all on function public.team_role_for(uuid, uuid) from public;
revoke all on function public.team_has_active_match(uuid) from public;
revoke all on function public.create_team(text, text, text, text, text) from public;
revoke all on function public.update_team(uuid, text, text, text, text) from public;
revoke all on function public.promote_member(uuid) from public;
revoke all on function public.demote_member(uuid) from public;
revoke all on function public.kick_member(uuid) from public;
revoke all on function public.transfer_leadership(uuid) from public;
revoke all on function public.disband_team() from public;

grant execute on function public.create_team(text, text, text, text, text) to authenticated;
grant execute on function public.update_team(uuid, text, text, text, text) to authenticated;
grant execute on function public.promote_member(uuid) to authenticated;
grant execute on function public.demote_member(uuid) to authenticated;
grant execute on function public.kick_member(uuid) to authenticated;
grant execute on function public.transfer_leadership(uuid) to authenticated;
grant execute on function public.disband_team() to authenticated;
