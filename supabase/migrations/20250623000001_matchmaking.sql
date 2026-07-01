-- Milestone 05 Phase 4: solo matchmaking queue, activity scoring, match completion + Elo.

create table public.match_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'solo' check (kind = 'solo'),
  match_type_id text not null references public.match_types (id),
  competitive_rating int not null check (competitive_rating >= 0),
  status text not null default 'waiting' check (status in ('waiting', 'paired', 'cancelled')),
  match_id uuid references public.matches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index match_queue_user_waiting_idx
  on public.match_queue (user_id)
  where status = 'waiting';

create index match_queue_waiting_created_idx
  on public.match_queue (created_at)
  where status = 'waiting';

create table public.match_activity_credits (
  activity_id uuid primary key references public.activities (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  points_awarded int not null check (points_awarded > 0),
  created_at timestamptz not null default now()
);

create index match_activity_credits_match_id_idx on public.match_activity_credits (match_id);

alter table public.match_queue enable row level security;
alter table public.match_activity_credits enable row level security;

create policy "match_queue_select_own"
  on public.match_queue for select
  to authenticated
  using (user_id = auth.uid());

create policy "match_activity_credits_select_participant"
  on public.match_activity_credits for select
  to authenticated
  using (public.can_view_match(match_id));

create trigger match_queue_set_updated_at
  before update on public.match_queue
  for each row execute function public.set_updated_at();

create or replace function public.match_points_for_distance(p_distance_meters numeric)
returns int
language sql
immutable
as $$
  select case
    when coalesce(p_distance_meters, 0) < 160.934 then 0
    else greatest(1, round((p_distance_meters / 1609.34) * 10.0)::int)
  end;
$$;

create or replace function public.solo_match_duration_interval(p_match_type_id text)
returns interval
language sql
immutable
as $$
  select case p_match_type_id
    when 'solo_distance' then interval '3 days'
    else interval '3 days'
  end;
$$;

create or replace function public.apply_elo_match_result_system(
  p_winner_user_id uuid,
  p_loser_user_id uuid,
  p_k_factor int default 32
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner public.player_rank%rowtype;
  v_loser public.player_rank%rowtype;
  v_winner_expected double precision;
  v_loser_expected double precision;
  v_winner_delta int;
  v_loser_delta int;
  v_winner_rating int;
  v_loser_rating int;
begin
  if p_winner_user_id is null or p_loser_user_id is null then
    raise exception 'Winner and loser are required';
  end if;

  if p_winner_user_id = p_loser_user_id then
    raise exception 'Winner and loser must be different users';
  end if;

  select *
    into v_winner
    from public.player_rank
    where user_id = p_winner_user_id
    for update;

  if not found then
    raise exception 'Winner rank row not found';
  end if;

  select *
    into v_loser
    from public.player_rank
    where user_id = p_loser_user_id
    for update;

  if not found then
    raise exception 'Loser rank row not found';
  end if;

  v_winner_expected := public.elo_expected_score(v_winner.competitive_rating, v_loser.competitive_rating);
  v_loser_expected := public.elo_expected_score(v_loser.competitive_rating, v_winner.competitive_rating);

  v_winner_delta := round(p_k_factor * (1.0 - v_winner_expected))::int;
  v_loser_delta := round(p_k_factor * (0.0 - v_loser_expected))::int;

  v_winner_rating := greatest(0, v_winner.competitive_rating + v_winner_delta);
  v_loser_rating := greatest(0, v_loser.competitive_rating + v_loser_delta);

  update public.player_rank
    set competitive_rating = v_winner_rating,
        season_wins = season_wins + 1
    where user_id = p_winner_user_id;

  update public.player_rank
    set competitive_rating = v_loser_rating,
        season_losses = season_losses + 1
    where user_id = p_loser_user_id;

  return jsonb_build_object(
    'winner_user_id', p_winner_user_id,
    'loser_user_id', p_loser_user_id,
    'winner_rating', v_winner_rating,
    'loser_rating', v_loser_rating,
    'winner_delta', v_winner_delta,
    'loser_delta', v_loser_delta
  );
end;
$$;

create or replace function public.finalize_solo_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_home public.match_participants%rowtype;
  v_away public.match_participants%rowtype;
  v_winner uuid;
  v_loser uuid;
  v_elo jsonb;
begin
  select *
    into v_match
    from public.matches
    where id = p_match_id
      and kind = 'solo'
    for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_match.status <> 'active' then
    return jsonb_build_object('status', 'already_finalized', 'match_status', v_match.status);
  end if;

  if v_match.ends_at > now() then
    return jsonb_build_object('status', 'not_due');
  end if;

  select *
    into v_home
    from public.match_participants
    where match_id = p_match_id
      and side = 'home'
    limit 1;

  select *
    into v_away
    from public.match_participants
    where match_id = p_match_id
      and side = 'away'
    limit 1;

  if v_home.user_id is null or v_away.user_id is null then
    update public.matches
      set status = 'cancelled'
      where id = p_match_id;

    return jsonb_build_object('status', 'cancelled_missing_participant');
  end if;

  update public.matches
    set status = 'completed'
    where id = p_match_id;

  if v_home.points = v_away.points then
    perform public.evaluate_achievements(v_home.user_id);
    perform public.evaluate_achievements(v_away.user_id);

    return jsonb_build_object(
      'status', 'completed',
      'result', 'tie',
      'home_user_id', v_home.user_id,
      'away_user_id', v_away.user_id,
      'home_points', v_home.points,
      'away_points', v_away.points
    );
  end if;

  if v_home.points > v_away.points then
    v_winner := v_home.user_id;
    v_loser := v_away.user_id;
  else
    v_winner := v_away.user_id;
    v_loser := v_home.user_id;
  end if;

  v_elo := public.apply_elo_match_result_system(v_winner, v_loser);

  perform public.evaluate_achievements(v_home.user_id);
  perform public.evaluate_achievements(v_away.user_id);

  return jsonb_build_object(
    'status', 'completed',
    'result', 'decided',
    'winner_user_id', v_winner,
    'loser_user_id', v_loser,
    'home_points', v_home.points,
    'away_points', v_away.points,
    'elo', v_elo
  );
end;
$$;

create or replace function public.finalize_due_solo_matches_for_user(p_user_id uuid default auth.uid())
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_count int := 0;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  for v_match_id in
    select m.id
    from public.matches m
    join public.match_participants mp on mp.match_id = m.id
    where mp.user_id = p_user_id
      and m.kind = 'solo'
      and m.status = 'active'
      and m.ends_at <= now()
  loop
    perform public.finalize_solo_match(v_match_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.try_pair_solo_queue()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seeker public.match_queue%rowtype;
  v_opponent public.match_queue%rowtype;
  v_match_id uuid;
  v_match_type public.match_types%rowtype;
  v_rating_window int := 400;
begin
  select *
    into v_seeker
    from public.match_queue
    where status = 'waiting'
    order by created_at asc
    limit 1
    for update skip locked;

  if not found then
    return null;
  end if;

  select mq.*
    into v_opponent
    from public.match_queue mq
    where mq.status = 'waiting'
      and mq.id <> v_seeker.id
      and mq.match_type_id = v_seeker.match_type_id
      and abs(mq.competitive_rating - v_seeker.competitive_rating) <= v_rating_window
    order by abs(mq.competitive_rating - v_seeker.competitive_rating) asc, mq.created_at asc
    limit 1
    for update skip locked;

  if not found then
    return null;
  end if;

  select *
    into v_match_type
    from public.match_types
    where id = v_seeker.match_type_id;

  if not found then
    raise exception 'Unknown match type';
  end if;

  insert into public.matches (match_type_id, kind, status, started_at, ends_at, state_json)
  values (
    v_seeker.match_type_id,
    'solo',
    'active',
    now(),
    now() + public.solo_match_duration_interval(v_seeker.match_type_id),
    jsonb_build_object(
      'matchType', v_match_type.display_name,
      'pairedAt', now()
    )
  )
  returning id into v_match_id;

  insert into public.match_participants (match_id, user_id, side, points, lineup_order)
  values
    (v_match_id, v_seeker.user_id, 'home', 0, 1),
    (v_match_id, v_opponent.user_id, 'away', 0, 1);

  update public.match_queue
    set status = 'paired',
        match_id = v_match_id
    where id in (v_seeker.id, v_opponent.id);

  return v_match_id;
end;
$$;

create or replace function public.enqueue_solo_matchmaking(
  p_match_type_id text default 'solo_distance'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rating int;
  v_existing_match_id uuid;
  v_queue public.match_queue%rowtype;
  v_match_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.finalize_due_solo_matches_for_user(v_user_id);

  select mp.match_id
    into v_existing_match_id
    from public.match_participants mp
    join public.matches m on m.id = mp.match_id
    where mp.user_id = v_user_id
      and m.kind = 'solo'
      and m.status = 'active'
    limit 1;

  if v_existing_match_id is not null then
    return jsonb_build_object(
      'status', 'in_match',
      'match_id', v_existing_match_id
    );
  end if;

  select *
    into v_queue
    from public.match_queue
    where user_id = v_user_id
      and status = 'waiting'
    limit 1;

  if found then
    return jsonb_build_object(
      'status', 'waiting',
      'queue_id', v_queue.id,
      'enqueued_at', v_queue.created_at
    );
  end if;

  if not exists (
    select 1 from public.match_types where id = p_match_type_id and kind = 'solo'
  ) then
    raise exception 'Invalid solo match type';
  end if;

  select coalesce(competitive_rating, 1000)
    into v_rating
    from public.player_rank
    where user_id = v_user_id;

  if not found then
    v_rating := 1000;
  end if;

  insert into public.match_queue (user_id, match_type_id, competitive_rating)
  values (v_user_id, p_match_type_id, v_rating)
  returning * into v_queue;

  v_match_id := public.try_pair_solo_queue();

  if v_match_id is not null then
    return jsonb_build_object(
      'status', 'matched',
      'match_id', v_match_id
    );
  end if;

  select *
    into v_queue
    from public.match_queue
    where id = v_queue.id;

  if v_queue.status = 'paired' and v_queue.match_id is not null then
    return jsonb_build_object(
      'status', 'matched',
      'match_id', v_queue.match_id
    );
  end if;

  return jsonb_build_object(
    'status', 'waiting',
    'queue_id', v_queue.id,
    'enqueued_at', v_queue.created_at
  );
end;
$$;

create or replace function public.cancel_solo_matchmaking()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.match_queue
    set status = 'cancelled'
    where user_id = v_user_id
      and status = 'waiting';

  get diagnostics v_updated = row_count;

  return jsonb_build_object('cancelled', v_updated > 0);
end;
$$;

create or replace function public.get_solo_matchmaking_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match_id uuid;
  v_queue public.match_queue%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.finalize_due_solo_matches_for_user(v_user_id);

  select mp.match_id
    into v_match_id
    from public.match_participants mp
    join public.matches m on m.id = mp.match_id
    where mp.user_id = v_user_id
      and m.kind = 'solo'
      and m.status = 'active'
    limit 1;

  if v_match_id is not null then
    return jsonb_build_object('status', 'in_match', 'match_id', v_match_id);
  end if;

  select *
    into v_queue
    from public.match_queue
    where user_id = v_user_id
      and status = 'waiting'
    limit 1;

  if found then
    v_match_id := public.try_pair_solo_queue();

    if v_match_id is not null then
      return jsonb_build_object('status', 'matched', 'match_id', v_match_id);
    end if;

    select *
      into v_queue
      from public.match_queue
      where user_id = v_user_id
        and status = 'waiting'
      limit 1;

    if not found then
      select match_id
        into v_match_id
        from public.match_queue
        where user_id = v_user_id
          and status = 'paired'
        order by updated_at desc
        limit 1;

      if v_match_id is not null then
        return jsonb_build_object('status', 'matched', 'match_id', v_match_id);
      end if;
    else
      return jsonb_build_object(
        'status', 'waiting',
        'queue_id', v_queue.id,
        'enqueued_at', v_queue.created_at
      );
    end if;
  end if;

  return jsonb_build_object('status', 'idle');
end;
$$;

create or replace function public.credit_match_activity(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_activity public.activities%rowtype;
  v_match public.matches%rowtype;
  v_points int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_activity
    from public.activities
    where id = p_activity_id
      and user_id = v_user_id
    for update;

  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.match_id is null then
    return jsonb_build_object('status', 'skipped', 'reason', 'no_match');
  end if;

  if exists (
    select 1 from public.match_activity_credits where activity_id = p_activity_id
  ) then
    return jsonb_build_object('status', 'already_credited');
  end if;

  select *
    into v_match
    from public.matches
    where id = v_activity.match_id
    for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.status <> 'active' then
    return jsonb_build_object('status', 'skipped', 'reason', 'match_not_active');
  end if;

  if not public.is_match_participant(v_match.id, v_user_id) then
    raise exception 'Not a match participant';
  end if;

  v_points := public.match_points_for_distance(v_activity.distance_meters);

  if v_points <= 0 then
    return jsonb_build_object('status', 'skipped', 'reason', 'below_minimum_distance');
  end if;

  insert into public.match_activity_credits (activity_id, match_id, user_id, points_awarded)
  values (p_activity_id, v_match.id, v_user_id, v_points);

  update public.match_participants
    set points = points + v_points
    where match_id = v_match.id
      and user_id = v_user_id;

  return jsonb_build_object(
    'status', 'credited',
    'match_id', v_match.id,
    'points_awarded', v_points
  );
end;
$$;

revoke all on function public.apply_elo_match_result_system(uuid, uuid, int) from public;
revoke all on function public.finalize_solo_match(uuid) from public;
revoke all on function public.finalize_due_solo_matches_for_user(uuid) from public;
revoke all on function public.try_pair_solo_queue() from public;
revoke all on function public.match_points_for_distance(numeric) from public;
revoke all on function public.solo_match_duration_interval(text) from public;

grant execute on function public.enqueue_solo_matchmaking(text) to authenticated;
grant execute on function public.cancel_solo_matchmaking() to authenticated;
grant execute on function public.get_solo_matchmaking_status() to authenticated;
grant execute on function public.credit_match_activity(uuid) to authenticated;
grant execute on function public.finalize_due_solo_matches_for_user(uuid) to authenticated;

update public.achievement_definitions
  set is_active = true
  where id in ('first_win', 'ten_wins');
