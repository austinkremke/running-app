-- Pace-weighted match scoring: same distance, faster pace earns more points.

create or replace function public.match_points_for_activity(
  p_distance_meters numeric,
  p_duration_seconds numeric default null
)
returns int
language sql
immutable
as $$
  with stats as (
    select
      coalesce(p_distance_meters, 0) as distance_meters,
      coalesce(p_duration_seconds, 0) as duration_seconds
  ),
  miles as (
    select distance_meters / 1609.34 as m
    from stats
    where distance_meters >= 160.934
  ),
  base_points as (
    select greatest(1, round(m * 10.0)::int) as pts
    from miles
  ),
  pace_sec_per_mile as (
    select
      case
        when duration_seconds > 0 then duration_seconds::double precision / m
        else null
      end as sec_per_mi
    from stats
    cross join miles
  ),
  pace_multiplier as (
    select
      case
        when sec_per_mi is null or sec_per_mi <= 0 then 1.0
        else least(1.25, greatest(0.85, 600.0 / sec_per_mi))
      end as mult
    from pace_sec_per_mile
  )
  select coalesce(
    (
      select greatest(1, round(pts * mult)::int)
      from base_points
      cross join pace_multiplier
    ),
    0
  )
  from stats;
$$;

create or replace function public.match_points_for_distance(p_distance_meters numeric)
returns int
language sql
immutable
as $$
  select public.match_points_for_activity(p_distance_meters, null);
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

  v_points := public.match_points_for_activity(
    v_activity.distance_meters,
    v_activity.duration_seconds
  );

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

grant execute on function public.match_points_for_activity(numeric, numeric) to authenticated;

update public.match_types
set
  scoring_details = 'Distance sets your base score (~10 pts/mi). Faster pace than 10:00/mi boosts points up to 25%; slower pace reduces them down to 15%.',
  overview = 'Outrun your opponent over 3 days. Miles set the base score; pace decides who gets more from the same distance.'
where id = 'solo_distance';
