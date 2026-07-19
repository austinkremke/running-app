-- Milestone 09 Phase 3: enforce the verification tier server-side.
-- Unverified imports (see computeVerificationTier in healthKitVerification.ts)
-- still sync and appear in the feed, but earn no XP and cannot score in
-- matches. verification_status is NULL for native phone-tracked runs, which
-- this must not affect at all — only 'unverified' blocks anything.

create or replace function public.award_run_xp(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_activity public.activities%rowtype;
  v_progress public.player_progress%rowtype;
  v_miles double precision;
  v_display_miles numeric;
  v_distance_xp int := 0;
  v_pace_sec double precision := 0;
  v_pace_xp int := 0;
  v_elevation_ft int := 0;
  v_elevation_xp int := 0;
  v_subtotal int := 0;
  v_streak_mult double precision;
  v_streak_bonus int := 0;
  v_first_run_bonus int := 0;
  v_total_xp int := 0;
  v_award_date date := (timezone('utc', now()))::date;
  v_awarded_today boolean;
  v_next_streak int;
  v_before_total bigint;
  v_after_total bigint;
  v_breakdown jsonb := '[]'::jsonb;
  v_existing_id uuid;
  v_next_rolling_pace int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_activity
    from public.activities
   where id = p_activity_id
     and user_id = v_user_id;

  if not found then
    raise exception 'Activity not found';
  end if;

  select id
    into v_existing_id
    from public.xp_ledger
   where user_id = v_user_id
     and source = 'run'
     and source_id = p_activity_id::text
     and amount > 0
   limit 1;

  select *
    into v_progress
    from public.player_progress
   where user_id = v_user_id
   for update;

  if not found then
    raise exception 'Player progress not found';
  end if;

  v_before_total := v_progress.total_xp;

  if v_activity.verification_status = 'unverified' then
    return jsonb_build_object(
      'xp_earned', 0,
      'already_awarded', false,
      'unverified', true,
      'before_total_xp', v_before_total,
      'total_xp', v_before_total,
      'breakdown', '[]'::jsonb,
      'streak_days', v_progress.streak_days,
      'last_award_date', v_progress.last_award_date,
      'rolling_avg_pace_sec', v_progress.rolling_avg_pace_sec
    );
  end if;

  if v_existing_id is not null then
    return jsonb_build_object(
      'xp_earned', 0,
      'already_awarded', true,
      'before_total_xp', v_before_total,
      'total_xp', v_before_total,
      'breakdown', '[]'::jsonb,
      'streak_days', v_progress.streak_days,
      'last_award_date', v_progress.last_award_date,
      'rolling_avg_pace_sec', v_progress.rolling_avg_pace_sec
    );
  end if;

  v_miles := v_activity.distance_meters / 1609.344;
  v_display_miles := round((v_activity.distance_meters / 1609.344)::numeric, 2);

  if v_display_miles < 0.1 then
    return jsonb_build_object(
      'xp_earned', 0,
      'already_awarded', false,
      'before_total_xp', v_before_total,
      'total_xp', v_before_total,
      'breakdown', '[]'::jsonb,
      'streak_days', v_progress.streak_days,
      'last_award_date', v_progress.last_award_date,
      'rolling_avg_pace_sec', v_progress.rolling_avg_pace_sec
    );
  end if;

  v_distance_xp := floor(v_miles * 100)::int;
  if v_miles < 0.25 then
    v_distance_xp := floor(v_distance_xp * (v_miles / 0.25))::int;
  end if;

  if v_miles > 0 and v_activity.duration_seconds > 0 then
    v_pace_sec := v_activity.duration_seconds::double precision / v_miles;
  end if;

  if v_progress.rolling_avg_pace_sec is not null
     and v_progress.rolling_avg_pace_sec > 0
     and v_pace_sec > 0
     and v_pace_sec < v_progress.rolling_avg_pace_sec
     and v_distance_xp > 0 then
    v_pace_xp := round(
      v_distance_xp * 0.3 * least(
        1.0,
        (v_progress.rolling_avg_pace_sec - v_pace_sec) / v_progress.rolling_avg_pace_sec
      )
    )::int;
  end if;

  v_elevation_ft := coalesce((v_activity.summary_json->>'elevationGain')::int, 0);
  v_elevation_xp := floor(v_elevation_ft / 50.0)::int * 2;

  v_subtotal := v_distance_xp + v_pace_xp + v_elevation_xp;

  v_awarded_today := v_progress.last_award_date = v_award_date;

  if v_awarded_today then
    v_next_streak := v_progress.streak_days;
  elsif v_progress.last_award_date = v_award_date - 1 then
    v_next_streak := greatest(1, v_progress.streak_days + 1);
  else
    v_next_streak := 1;
  end if;

  v_streak_mult := 1 + 0.05 * least(greatest(v_next_streak, 0), 7);

  if v_next_streak > 0 and v_subtotal > 0 then
    v_streak_bonus := round(v_subtotal * (v_streak_mult - 1))::int;
  end if;

  if not v_awarded_today then
    v_first_run_bonus := 50;
  end if;

  v_total_xp := least(5000, round(v_subtotal * v_streak_mult)::int + v_first_run_bonus);

  if v_distance_xp > 0 then
    v_breakdown := v_breakdown || jsonb_build_array(
      jsonb_build_object('key', 'distance', 'label', 'Distance', 'xp', v_distance_xp)
    );
  end if;

  if v_pace_xp > 0 then
    v_breakdown := v_breakdown || jsonb_build_array(
      jsonb_build_object('key', 'pace', 'label', 'Pace effort', 'xp', v_pace_xp)
    );
  end if;

  if v_elevation_xp > 0 then
    v_breakdown := v_breakdown || jsonb_build_array(
      jsonb_build_object('key', 'elevation', 'label', 'Elevation', 'xp', v_elevation_xp)
    );
  end if;

  if v_streak_bonus > 0 then
    v_breakdown := v_breakdown || jsonb_build_array(
      jsonb_build_object(
        'key', 'streak',
        'label', format('%s-day streak', v_next_streak),
        'xp', v_streak_bonus
      )
    );
  end if;

  if v_first_run_bonus > 0 then
    v_breakdown := v_breakdown || jsonb_build_array(
      jsonb_build_object('key', 'first-run-today', 'label', 'First run today', 'xp', v_first_run_bonus)
    );
  end if;

  if v_pace_sec > 0 then
    if v_progress.rolling_avg_pace_sec is null or v_progress.rolling_avg_pace_sec <= 0 then
      v_next_rolling_pace := round(v_pace_sec)::int;
    else
      v_next_rolling_pace := round(v_progress.rolling_avg_pace_sec * 0.7 + v_pace_sec * 0.3)::int;
    end if;
  else
    v_next_rolling_pace := v_progress.rolling_avg_pace_sec;
  end if;

  if v_total_xp > 0 then
    insert into public.xp_ledger (
      user_id,
      amount,
      source,
      source_id,
      breakdown_json
    ) values (
      v_user_id,
      v_total_xp,
      'run',
      p_activity_id::text,
      v_breakdown
    );

    update public.player_progress
       set total_xp = total_xp + v_total_xp,
           streak_days = v_next_streak,
           last_award_date = v_award_date,
           rolling_avg_pace_sec = v_next_rolling_pace
     where user_id = v_user_id;
  end if;

  v_after_total := v_before_total + v_total_xp;

  return jsonb_build_object(
    'xp_earned', v_total_xp,
    'already_awarded', false,
    'before_total_xp', v_before_total,
    'total_xp', v_after_total,
    'breakdown', v_breakdown,
    'streak_days', v_next_streak,
    'last_award_date', v_award_date,
    'rolling_avg_pace_sec', v_next_rolling_pace
  );
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

  if v_activity.verification_status = 'unverified' then
    return jsonb_build_object('status', 'skipped', 'reason', 'unverified');
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
