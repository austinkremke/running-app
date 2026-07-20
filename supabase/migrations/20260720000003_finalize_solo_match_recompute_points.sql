-- Fixes the same class of bug found earlier on the client (SoloMatchScreen
-- showing 0-0/tied because it trusted match_participants.points instead of
-- recomputing from synced activities): finalize_solo_match decided the
-- winner and persisted the final score from match_participants.points,
-- which is only incremented by the client's credit_match_activity RPC call
-- after each run syncs — a call that can silently fail (activitySync.ts
-- swallows credit errors) or simply not have run yet before the match's
-- ends_at passes and finalize_due_solo_matches_for_user fires. Result: a
-- match a player was genuinely leading in could finalize as a 0-0 tie.
--
-- Fix: recompute each side's points once, authoritatively, from activities
-- at finalize time (mirrors match_points_for_activity, same function used
-- by credit_match_activity itself) and write the corrected value back into
-- match_participants.points. Every downstream reader — persist_solo_match_
-- completions, finalize_due_solo_matches_for_user, the season record, the
-- completion drawer — already reads match_participants.points fresh from
-- the table, so fixing it once here is sufficient; no other function needs
-- to change.

create or replace function public.match_side_points(p_match_id uuid, p_user_id uuid)
returns int
language sql
stable
set search_path = public
as $$
  select coalesce(sum(public.match_points_for_activity(a.distance_meters::numeric, a.duration_seconds::numeric)), 0)::int
  from public.activities a
  where a.match_id = p_match_id
    and a.user_id = p_user_id;
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
  v_home_points int;
  v_away_points int;
  v_winner uuid;
  v_loser uuid;
  v_elo jsonb;
  v_result jsonb;
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

  v_home_points := public.match_side_points(p_match_id, v_home.user_id);
  v_away_points := public.match_side_points(p_match_id, v_away.user_id);

  update public.match_participants set points = v_home_points
    where match_id = p_match_id and side = 'home';
  update public.match_participants set points = v_away_points
    where match_id = p_match_id and side = 'away';

  if v_home_points = v_away_points then
    perform public.evaluate_achievements_system(v_home.user_id);
    perform public.evaluate_achievements_system(v_away.user_id);

    v_result := jsonb_build_object(
      'status', 'completed',
      'result', 'tie',
      'home_user_id', v_home.user_id,
      'away_user_id', v_away.user_id,
      'home_points', v_home_points,
      'away_points', v_away_points
    );

    perform public.persist_solo_match_completions(p_match_id, v_result);
    return v_result;
  end if;

  if v_home_points > v_away_points then
    v_winner := v_home.user_id;
    v_loser := v_away.user_id;
  else
    v_winner := v_away.user_id;
    v_loser := v_home.user_id;
  end if;

  v_elo := public.apply_elo_match_result_system(v_winner, v_loser);

  perform public.evaluate_achievements_system(v_home.user_id);
  perform public.evaluate_achievements_system(v_away.user_id);

  v_result := jsonb_build_object(
    'status', 'completed',
    'result', 'decided',
    'winner_user_id', v_winner,
    'loser_user_id', v_loser,
    'home_points', v_home_points,
    'away_points', v_away_points,
    'elo', v_elo
  );

  perform public.persist_solo_match_completions(p_match_id, v_result);
  return v_result;
end;
$$;
