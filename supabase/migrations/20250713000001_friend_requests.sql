-- Friend requests: sending a friend request no longer instantly creates a
-- friendship. It creates a pending request the recipient sees in the same
-- notification system as team invites/requests, and can accept or decline.
-- Mirrors team_membership_requests, one-directional instead of two-kind.

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

-- One pending request per direction — prevents duplicate spam.
create unique index friend_requests_pending_idx
  on public.friend_requests (from_user_id, to_user_id)
  where status = 'pending';

create index friend_requests_to_user_pending_idx
  on public.friend_requests (to_user_id)
  where status = 'pending';

alter table public.friend_requests enable row level security;

create policy "friend_requests_select_relevant"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create trigger friend_requests_set_updated_at
  before update on public.friend_requests
  for each row execute function public.set_updated_at();

create or replace function public.send_friend_request(p_to_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_reverse public.friend_requests%rowtype;
  v_request public.friend_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if p_to_user_id = v_actor then
    raise exception 'You cannot friend yourself';
  end if;

  if not exists (select 1 from public.profiles where id = p_to_user_id) then
    raise exception 'User not found';
  end if;

  if public.are_friends(v_actor, p_to_user_id) then
    return jsonb_build_object('status', 'already_friends');
  end if;

  if exists (
    select 1 from public.friend_requests
    where from_user_id = v_actor and to_user_id = p_to_user_id and status = 'pending'
  ) then
    return jsonb_build_object('status', 'already_pending');
  end if;

  -- The other person already asked us — accept instead of creating a second pending row.
  select * into v_reverse
    from public.friend_requests
    where from_user_id = p_to_user_id and to_user_id = v_actor and status = 'pending'
    limit 1;

  if found then
    update public.friend_requests set status = 'accepted' where id = v_reverse.id;
    perform public.add_friend(p_to_user_id);
    return jsonb_build_object('status', 'accepted');
  end if;

  insert into public.friend_requests (from_user_id, to_user_id)
  values (v_actor, p_to_user_id)
  returning * into v_request;

  return jsonb_build_object('status', 'requested', 'request_id', v_request.id);
end;
$$;

create or replace function public.respond_to_friend_request(p_request_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.friend_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
    from public.friend_requests where id = p_request_id for update;

  if not found or v_request.to_user_id <> v_actor then
    raise exception 'Friend request not found';
  end if;

  if v_request.status <> 'pending' then
    return jsonb_build_object('status', v_request.status);
  end if;

  if not p_accept then
    update public.friend_requests set status = 'declined' where id = p_request_id;
    return jsonb_build_object('status', 'declined');
  end if;

  update public.friend_requests set status = 'accepted' where id = p_request_id;
  perform public.add_friend(v_request.from_user_id);
  return jsonb_build_object('status', 'accepted');
end;
$$;

create or replace function public.cancel_friend_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.friend_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
    from public.friend_requests where id = p_request_id for update;

  if not found or v_request.from_user_id <> v_actor then
    raise exception 'You cannot cancel this request';
  end if;

  if v_request.status = 'pending' then
    update public.friend_requests set status = 'cancelled' where id = p_request_id;
  end if;

  return jsonb_build_object('status', 'cancelled');
end;
$$;

-- Pending friend requests addressed to the caller, with the requester's profile.
create or replace function public.get_friend_notifications()
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
      'actor_id', actor.id,
      'actor_name', actor.display_name,
      'actor_avatar_url', actor.avatar_url,
      'actor_level', public.level_from_total_xp(coalesce(pp.total_xp, 0)::bigint),
      'created_at', r.created_at
    ) as item
    from public.friend_requests r
    join public.profiles actor on actor.id = r.from_user_id
    left join public.player_progress pp on pp.user_id = actor.id
    where r.status = 'pending' and r.to_user_id = auth.uid()
  ) items;
$$;

create or replace function public.has_friend_notifications()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friend_requests
    where status = 'pending' and to_user_id = auth.uid()
  );
$$;

revoke all on function public.send_friend_request(uuid) from public;
revoke all on function public.respond_to_friend_request(uuid, boolean) from public;
revoke all on function public.cancel_friend_request(uuid) from public;
revoke all on function public.get_friend_notifications() from public;
revoke all on function public.has_friend_notifications() from public;

grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.get_friend_notifications() to authenticated;
grant execute on function public.has_friend_notifications() to authenticated;
