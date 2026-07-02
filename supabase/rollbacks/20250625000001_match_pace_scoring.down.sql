-- Rollback for 20250625000001_match_pace_scoring.sql

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

drop function if exists public.match_points_for_activity(numeric, numeric);

update public.match_types
set
  scoring_details = 'Distance and pace both contribute to your match score.',
  overview = 'Outrun your opponent over 3 days. Every synced mile earns points toward your total.'
where id = 'solo_distance';
