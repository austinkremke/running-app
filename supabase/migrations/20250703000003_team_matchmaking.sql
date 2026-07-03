-- Milestone 07 Phase 3: team matchmaking queue.
-- Mirrors solo matchmaking (20250623000001) but pairs teams: rating from
-- team_rank, leader/co-leader queue rights, roster snapshot at pairing (all
-- current members of both teams enrolled as match_participants). Scoring +
-- finalize are Phase 4; matches created here stay active until then.

create table public.team_match_queue (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  match_type_id text not null references public.match_types (id),
  competitive_rating int not null check (competitive_rating >= 0),
  status text not null default 'waiting' check (status in ('waiting', 'paired', 'cancelled')),
  match_id uuid references public.matches (id) on delete set null,
  enqueued_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index team_match_queue_team_waiting_idx
  on public.team_match_queue (team_id)
  where status = 'waiting';

create index team_match_queue_waiting_created_idx
  on public.team_match_queue (created_at)
  where status = 'waiting';

alter table public.team_match_queue enable row level security;

-- Members can see their own team's queue row (drives the searching state).
create policy "team_match_queue_select_own_team"
  on public.team_match_queue for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_match_queue.team_id
        and tm.user_id = auth.uid()
    )
  );

create trigger team_match_queue_set_updated_at
  before update on public.team_match_queue
  for each row execute function public.set_updated_at();

-- Minimum roster required to queue a team.
create or replace function public.team_min_roster_to_queue()
returns int
language sql
immutable
as $$ select 2; $$;

-- Enroll every current member of a team into a match on the given side.
create or replace function public.enroll_team_roster(
  p_match_id uuid,
  p_team_id uuid,
  p_side text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.match_participants (match_id, user_id, team_id, side, points, lineup_order)
  select
    p_match_id,
    tm.user_id,
    p_team_id,
    p_side,
    0,
    row_number() over (order by tm.joined_at asc)
  from public.team_members tm
  where tm.team_id = p_team_id;
end;
$$;

create or replace function public.try_pair_team_queue()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seeker public.team_match_queue%rowtype;
  v_opponent public.team_match_queue%rowtype;
  v_match_id uuid;
  v_match_type public.match_types%rowtype;
  v_rating_window int := 400;
begin
  select *
    into v_seeker
    from public.team_match_queue
    where status = 'waiting'
    order by created_at asc
    limit 1
    for update skip locked;

  if not found then
    return null;
  end if;

  select tmq.*
    into v_opponent
    from public.team_match_queue tmq
    where tmq.status = 'waiting'
      and tmq.id <> v_seeker.id
      and tmq.team_id <> v_seeker.team_id
      and tmq.match_type_id = v_seeker.match_type_id
      and abs(tmq.competitive_rating - v_seeker.competitive_rating) <= v_rating_window
    order by abs(tmq.competitive_rating - v_seeker.competitive_rating) asc, tmq.created_at asc
    limit 1
    for update skip locked;

  if not found then
    return null;
  end if;

  select * into v_match_type from public.match_types where id = v_seeker.match_type_id;
  if not found then
    raise exception 'Unknown match type';
  end if;

  insert into public.matches (
    match_type_id, kind, status, started_at, ends_at, home_team_id, away_team_id, state_json
  )
  values (
    v_seeker.match_type_id,
    'team',
    'active',
    now(),
    now() + interval '3 days',
    v_seeker.team_id,
    v_opponent.team_id,
    jsonb_build_object('matchType', v_match_type.display_name, 'pairedAt', now())
  )
  returning id into v_match_id;

  perform public.enroll_team_roster(v_match_id, v_seeker.team_id, 'home');
  perform public.enroll_team_roster(v_match_id, v_opponent.team_id, 'away');

  update public.team_match_queue
    set status = 'paired', match_id = v_match_id
    where id in (v_seeker.id, v_opponent.id);

  return v_match_id;
end;
$$;

-- Active team match id for a team (non-expired), or null.
create or replace function public.team_active_match_id(p_team_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.matches
  where kind = 'team'
    and status = 'active'
    and ends_at > now()
    and p_team_id in (home_team_id, away_team_id)
  order by ends_at desc
  limit 1;
$$;

create or replace function public.enqueue_team_matchmaking(
  p_match_type_id text default 'team_3day'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_team_id uuid;
  v_role text;
  v_roster int;
  v_rating int;
  v_existing_match_id uuid;
  v_queue public.team_match_queue%rowtype;
  v_match_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select team_id, role
    into v_team_id, v_role
    from public.team_members
    where user_id = v_user_id;

  if v_team_id is null then
    raise exception 'Join a team before finding a match';
  end if;

  if v_role not in ('leader', 'co-leader') then
    raise exception 'Only team leaders can find a match';
  end if;

  if not exists (select 1 from public.match_types where id = p_match_type_id and kind = 'team') then
    raise exception 'Invalid team match type';
  end if;

  v_existing_match_id := public.team_active_match_id(v_team_id);
  if v_existing_match_id is not null then
    return jsonb_build_object('status', 'in_match', 'match_id', v_existing_match_id);
  end if;

  select count(*) into v_roster from public.team_members where team_id = v_team_id;
  if v_roster < public.team_min_roster_to_queue() then
    raise exception 'Your team needs at least % members to find a match', public.team_min_roster_to_queue();
  end if;

  select * into v_queue
    from public.team_match_queue
    where team_id = v_team_id and status = 'waiting'
    limit 1;

  if found then
    return jsonb_build_object('status', 'waiting', 'queue_id', v_queue.id, 'enqueued_at', v_queue.created_at);
  end if;

  select coalesce(competitive_rating, 1000) into v_rating
    from public.team_rank where team_id = v_team_id;

  if not found then
    v_rating := 1000;
  end if;

  insert into public.team_match_queue (team_id, match_type_id, competitive_rating, enqueued_by)
  values (v_team_id, p_match_type_id, v_rating, v_user_id)
  returning * into v_queue;

  v_match_id := public.try_pair_team_queue();
  if v_match_id is not null then
    return jsonb_build_object('status', 'matched', 'match_id', v_match_id);
  end if;

  select * into v_queue from public.team_match_queue where id = v_queue.id;

  if v_queue.status = 'paired' and v_queue.match_id is not null then
    return jsonb_build_object('status', 'matched', 'match_id', v_queue.match_id);
  end if;

  return jsonb_build_object('status', 'waiting', 'queue_id', v_queue.id, 'enqueued_at', v_queue.created_at);
end;
$$;

create or replace function public.cancel_team_matchmaking()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_team_id uuid;
  v_role text;
  v_updated int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select team_id, role into v_team_id, v_role
    from public.team_members where user_id = v_user_id;

  if v_team_id is null or v_role not in ('leader', 'co-leader') then
    raise exception 'Only team leaders can cancel matchmaking';
  end if;

  update public.team_match_queue
    set status = 'cancelled'
    where team_id = v_team_id and status = 'waiting';

  get diagnostics v_updated = row_count;
  return jsonb_build_object('cancelled', v_updated > 0);
end;
$$;

create or replace function public.get_team_matchmaking_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_team_id uuid;
  v_match_id uuid;
  v_queue public.team_match_queue%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select team_id into v_team_id from public.team_members where user_id = v_user_id;
  if v_team_id is null then
    return jsonb_build_object('status', 'idle');
  end if;

  v_match_id := public.team_active_match_id(v_team_id);
  if v_match_id is not null then
    return jsonb_build_object('status', 'in_match', 'match_id', v_match_id);
  end if;

  select * into v_queue
    from public.team_match_queue
    where team_id = v_team_id and status = 'waiting'
    limit 1;

  if found then
    v_match_id := public.try_pair_team_queue();
    if v_match_id is not null then
      return jsonb_build_object('status', 'matched', 'match_id', v_match_id);
    end if;

    select * into v_queue
      from public.team_match_queue
      where team_id = v_team_id and status = 'waiting'
      limit 1;

    if found then
      return jsonb_build_object('status', 'waiting', 'queue_id', v_queue.id, 'enqueued_at', v_queue.created_at);
    end if;

    select match_id into v_match_id
      from public.team_match_queue
      where team_id = v_team_id and status = 'paired'
      order by updated_at desc
      limit 1;

    if v_match_id is not null then
      return jsonb_build_object('status', 'matched', 'match_id', v_match_id);
    end if;
  end if;

  return jsonb_build_object('status', 'idle');
end;
$$;

revoke all on function public.team_min_roster_to_queue() from public;
revoke all on function public.enroll_team_roster(uuid, uuid, text) from public;
revoke all on function public.try_pair_team_queue() from public;
revoke all on function public.team_active_match_id(uuid) from public;
revoke all on function public.enqueue_team_matchmaking(text) from public;
revoke all on function public.cancel_team_matchmaking() from public;
revoke all on function public.get_team_matchmaking_status() from public;

grant execute on function public.enqueue_team_matchmaking(text) to authenticated;
grant execute on function public.cancel_team_matchmaking() to authenticated;
grant execute on function public.get_team_matchmaking_status() to authenticated;
