-- Allow system match finalization to evaluate achievements for both participants.

create or replace function public.evaluate_achievements_system(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_definition public.achievement_definitions%rowtype;
  v_unlock jsonb;
  v_unlocked jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    return '[]'::jsonb;
  end if;

  for v_definition in
    select *
    from public.achievement_definitions
    where is_active = true
    order by sort_order, id
  loop
    if public.user_meets_achievement(p_user_id, v_definition) then
      v_unlock := public.grant_achievement(p_user_id, v_definition.id);
      if v_unlock is not null then
        v_unlocked := v_unlocked || jsonb_build_array(v_unlock);
      end if;
    end if;
  end loop;

  return v_unlocked;
end;
$$;

revoke all on function public.evaluate_achievements_system(uuid) from public;

create or replace function public.evaluate_achievements(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id <> auth.uid() then
    raise exception 'Cannot evaluate achievements for another user';
  end if;

  return public.evaluate_achievements_system(p_user_id);
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

  if v_home.points = v_away.points then
    perform public.evaluate_achievements_system(v_home.user_id);
    perform public.evaluate_achievements_system(v_away.user_id);

    v_result := jsonb_build_object(
      'status', 'completed',
      'result', 'tie',
      'home_user_id', v_home.user_id,
      'away_user_id', v_away.user_id,
      'home_points', v_home.points,
      'away_points', v_away.points
    );

    perform public.persist_solo_match_completions(p_match_id, v_result);
    return v_result;
  end if;

  if v_home.points > v_away.points then
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
    'home_points', v_home.points,
    'away_points', v_away.points,
    'elo', v_elo
  );

  perform public.persist_solo_match_completions(p_match_id, v_result);
  return v_result;
end;
$$;

grant execute on function public.evaluate_achievements(uuid) to authenticated;
