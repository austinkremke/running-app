-- Friend-directed solo match challenges.

create table public.solo_match_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles (id) on delete cascade,
  challenged_id uuid not null references public.profiles (id) on delete cascade,
  match_type_id text not null default 'solo_distance' references public.match_types (id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  match_id uuid references public.matches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint solo_match_challenges_different_users check (challenger_id <> challenged_id)
);

create unique index solo_match_challenges_challenger_pending_idx
  on public.solo_match_challenges (challenger_id)
  where status = 'pending';

create unique index solo_match_challenges_pair_pending_idx
  on public.solo_match_challenges (
    least(challenger_id, challenged_id),
    greatest(challenger_id, challenged_id)
  )
  where status = 'pending';

create index solo_match_challenges_challenged_pending_idx
  on public.solo_match_challenges (challenged_id, created_at desc)
  where status = 'pending';

alter table public.solo_match_challenges enable row level security;

create policy "solo_match_challenges_select_participant"
  on public.solo_match_challenges for select
  to authenticated
  using (challenger_id = auth.uid() or challenged_id = auth.uid());

create trigger solo_match_challenges_set_updated_at
  before update on public.solo_match_challenges
  for each row execute function public.set_updated_at();

create or replace function public.expire_stale_solo_match_challenges()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.solo_match_challenges
    set status = 'expired'
    where status = 'pending'
      and expires_at <= now();
end;
$$;

create or replace function public.user_has_live_active_solo_match(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.match_participants mp
    join public.matches m on m.id = mp.match_id
    where mp.user_id = p_user_id
      and m.kind = 'solo'
      and m.status = 'active'
      and m.ends_at > now()
  );
$$;

create or replace function public.user_is_waiting_in_solo_queue(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.match_queue
    where user_id = p_user_id
      and status = 'waiting'
  );
$$;

create or replace function public.create_solo_match_for_users(
  p_home_user_id uuid,
  p_away_user_id uuid,
  p_match_type_id text default 'solo_distance'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_type public.match_types%rowtype;
  v_match_id uuid;
begin
  if p_home_user_id is null or p_away_user_id is null then
    raise exception 'Both users are required';
  end if;

  if p_home_user_id = p_away_user_id then
    raise exception 'Users must be different';
  end if;

  select *
    into v_match_type
    from public.match_types
    where id = p_match_type_id;

  if not found then
    raise exception 'Unknown match type';
  end if;

  insert into public.matches (match_type_id, kind, status, started_at, ends_at, state_json)
  values (
    p_match_type_id,
    'solo',
    'active',
    now(),
    now() + public.solo_match_duration_interval(p_match_type_id),
    jsonb_build_object(
      'matchType', v_match_type.display_name,
      'pairedAt', now(),
      'source', 'friend_challenge'
    )
  )
  returning id into v_match_id;

  insert into public.match_participants (match_id, user_id, side, points, lineup_order)
  values
    (v_match_id, p_home_user_id, 'home', 0, 1),
    (v_match_id, p_away_user_id, 'away', 0, 1);

  update public.match_queue
    set status = 'cancelled'
    where user_id in (p_home_user_id, p_away_user_id)
      and status = 'waiting';

  return v_match_id;
end;
$$;

create or replace function public.send_solo_match_challenge(
  p_challenged_user_id uuid,
  p_match_type_id text default 'solo_distance'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.solo_match_challenges%rowtype;
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_challenged_user_id is null then
    raise exception 'Friend is required';
  end if;

  if v_user_id = p_challenged_user_id then
    raise exception 'Cannot challenge yourself';
  end if;

  if not public.are_friends(v_user_id, p_challenged_user_id) then
    raise exception 'You can only challenge friends';
  end if;

  perform public.expire_stale_solo_match_challenges();
  perform public.finalize_due_solo_matches_for_user(v_user_id);
  perform public.finalize_due_solo_matches_for_user(p_challenged_user_id);

  if public.user_has_live_active_solo_match(v_user_id) then
    raise exception 'Finish your current match before sending a challenge';
  end if;

  if public.user_has_live_active_solo_match(p_challenged_user_id) then
    raise exception 'That friend is already in a match';
  end if;

  if public.user_is_waiting_in_solo_queue(v_user_id) then
    raise exception 'Cancel matchmaking before sending a challenge';
  end if;

  if public.user_is_waiting_in_solo_queue(p_challenged_user_id) then
    raise exception 'That friend is currently searching for a match';
  end if;

  if exists (
    select 1
    from public.solo_match_challenges
    where status = 'pending'
      and (
        (challenger_id = v_user_id and challenged_id = p_challenged_user_id)
        or (challenger_id = p_challenged_user_id and challenged_id = v_user_id)
      )
  ) then
    raise exception 'A challenge is already pending with this friend';
  end if;

  insert into public.solo_match_challenges (
    challenger_id,
    challenged_id,
    match_type_id
  )
  values (
    v_user_id,
    p_challenged_user_id,
    coalesce(p_match_type_id, 'solo_distance')
  )
  returning * into v_challenge;

  select *
    into v_profile
    from public.profiles
    where id = p_challenged_user_id;

  return jsonb_build_object(
    'challenge_id', v_challenge.id,
    'created_at', v_challenge.created_at,
    'challenged_user_id', p_challenged_user_id,
    'challenged_name', coalesce(v_profile.display_name, 'Friend'),
    'challenged_avatar_url', v_profile.avatar_url
  );
end;
$$;

create or replace function public.accept_solo_match_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.solo_match_challenges%rowtype;
  v_match_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_challenge_id is null then
    raise exception 'Challenge is required';
  end if;

  perform public.expire_stale_solo_match_challenges();
  perform public.finalize_due_solo_matches_for_user(v_user_id);

  select *
    into v_challenge
    from public.solo_match_challenges
    where id = p_challenge_id
    for update;

  if not found then
    raise exception 'Challenge not found';
  end if;

  if v_challenge.challenged_id <> v_user_id then
    raise exception 'Only the challenged player can accept';
  end if;

  if v_challenge.status <> 'pending' then
    raise exception 'Challenge is no longer available';
  end if;

  if v_challenge.expires_at <= now() then
    update public.solo_match_challenges
      set status = 'expired'
      where id = v_challenge.id;
    raise exception 'Challenge has expired';
  end if;

  perform public.finalize_due_solo_matches_for_user(v_challenge.challenger_id);

  if public.user_has_live_active_solo_match(v_user_id) then
    raise exception 'Finish your current match before accepting';
  end if;

  if public.user_has_live_active_solo_match(v_challenge.challenger_id) then
    update public.solo_match_challenges
      set status = 'cancelled'
      where id = v_challenge.id;
    raise exception 'Challenger is already in a match';
  end if;

  if public.user_is_waiting_in_solo_queue(v_user_id)
     or public.user_is_waiting_in_solo_queue(v_challenge.challenger_id) then
    raise exception 'Cancel matchmaking before accepting a challenge';
  end if;

  v_match_id := public.create_solo_match_for_users(
    v_challenge.challenger_id,
    v_challenge.challenged_id,
    v_challenge.match_type_id
  );

  update public.solo_match_challenges
    set status = 'accepted',
        match_id = v_match_id
    where id = v_challenge.id;

  update public.solo_match_challenges
    set status = 'cancelled'
    where status = 'pending'
      and id <> v_challenge.id
      and (
        challenger_id in (v_challenge.challenger_id, v_challenge.challenged_id)
        or challenged_id in (v_challenge.challenger_id, v_challenge.challenged_id)
      );

  return jsonb_build_object(
    'status', 'accepted',
    'match_id', v_match_id
  );
end;
$$;

create or replace function public.decline_solo_match_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.solo_match_challenges%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_challenge
    from public.solo_match_challenges
    where id = p_challenge_id
    for update;

  if not found then
    raise exception 'Challenge not found';
  end if;

  if v_challenge.challenged_id <> v_user_id then
    raise exception 'Only the challenged player can decline';
  end if;

  if v_challenge.status <> 'pending' then
    raise exception 'Challenge is no longer available';
  end if;

  update public.solo_match_challenges
    set status = 'declined'
    where id = v_challenge.id;

  return jsonb_build_object('status', 'declined');
end;
$$;

create or replace function public.cancel_solo_match_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.solo_match_challenges%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_challenge
    from public.solo_match_challenges
    where id = p_challenge_id
    for update;

  if not found then
    raise exception 'Challenge not found';
  end if;

  if v_challenge.challenger_id <> v_user_id then
    raise exception 'Only the challenger can cancel';
  end if;

  if v_challenge.status <> 'pending' then
    raise exception 'Challenge is no longer available';
  end if;

  update public.solo_match_challenges
    set status = 'cancelled'
    where id = v_challenge.id;

  return jsonb_build_object('status', 'cancelled');
end;
$$;

create or replace function public.get_solo_match_challenge_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_sent jsonb;
  v_received jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.expire_stale_solo_match_challenges();

  select jsonb_build_object(
    'challenge_id', c.id,
    'created_at', c.created_at,
    'challenged_user_id', c.challenged_id,
    'challenged_name', coalesce(p.display_name, 'Friend'),
    'challenged_avatar_url', p.avatar_url,
    'challenged_total_xp', coalesce(pp.total_xp, 0)
  )
    into v_sent
    from public.solo_match_challenges c
    join public.profiles p on p.id = c.challenged_id
    left join public.player_progress pp on pp.user_id = c.challenged_id
    where c.challenger_id = v_user_id
      and c.status = 'pending'
    order by c.created_at desc
    limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'challenge_id', c.id,
        'created_at', c.created_at,
        'challenger_user_id', c.challenger_id,
        'challenger_name', coalesce(p.display_name, 'Runner'),
        'challenger_avatar_url', p.avatar_url,
        'challenger_total_xp', coalesce(pp.total_xp, 0)
      )
      order by c.created_at desc
    ),
    '[]'::jsonb
  )
    into v_received
    from public.solo_match_challenges c
    join public.profiles p on p.id = c.challenger_id
    left join public.player_progress pp on pp.user_id = c.challenger_id
    where c.challenged_id = v_user_id
      and c.status = 'pending';

  return jsonb_build_object(
    'sent', v_sent,
    'received', v_received
  );
end;
$$;

create or replace function public.has_incoming_solo_match_challenge(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.solo_match_challenges
    where challenged_id = p_user_id
      and status = 'pending'
      and expires_at > now()
  );
$$;

revoke all on function public.expire_stale_solo_match_challenges() from public;
revoke all on function public.user_has_live_active_solo_match(uuid) from public;
revoke all on function public.user_is_waiting_in_solo_queue(uuid) from public;
revoke all on function public.create_solo_match_for_users(uuid, uuid, text) from public;

grant execute on function public.send_solo_match_challenge(uuid, text) to authenticated;
grant execute on function public.accept_solo_match_challenge(uuid) to authenticated;
grant execute on function public.decline_solo_match_challenge(uuid) to authenticated;
grant execute on function public.cancel_solo_match_challenge(uuid) to authenticated;
grant execute on function public.get_solo_match_challenge_status() to authenticated;
grant execute on function public.has_incoming_solo_match_challenge(uuid) to authenticated;
