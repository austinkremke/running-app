-- Persist solo match completion summaries on the match row for the result screen.

create or replace function public.persist_solo_match_completions(
  p_match_id uuid,
  p_result jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home public.match_participants%rowtype;
  v_away public.match_participants%rowtype;
  v_home_name text;
  v_away_name text;
  v_completions jsonb := '{}'::jsonb;
begin
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

  select display_name into v_home_name from public.profiles where id = v_home.user_id;
  select display_name into v_away_name from public.profiles where id = v_away.user_id;

  v_home_name := coalesce(v_home_name, 'Opponent');
  v_away_name := coalesce(v_away_name, 'Opponent');

  if (p_result ->> 'result') = 'tie' then
    v_completions := jsonb_build_object(
      v_home.user_id::text, jsonb_build_object(
        'match_id', p_match_id,
        'outcome', 'tie',
        'my_points', coalesce(v_home.points, 0),
        'opponent_points', coalesce(v_away.points, 0),
        'opponent_name', v_away_name,
        'rating_delta', 0,
        'new_rating', (select competitive_rating from public.player_rank where user_id = v_home.user_id),
        'previous_rating', (select competitive_rating from public.player_rank where user_id = v_home.user_id)
      ),
      v_away.user_id::text, jsonb_build_object(
        'match_id', p_match_id,
        'outcome', 'tie',
        'my_points', coalesce(v_away.points, 0),
        'opponent_points', coalesce(v_home.points, 0),
        'opponent_name', v_home_name,
        'rating_delta', 0,
        'new_rating', (select competitive_rating from public.player_rank where user_id = v_away.user_id),
        'previous_rating', (select competitive_rating from public.player_rank where user_id = v_away.user_id)
      )
    );
  else
    v_completions := jsonb_build_object(
      (p_result ->> 'winner_user_id'), jsonb_build_object(
        'match_id', p_match_id,
        'outcome', 'win',
        'my_points', case when v_home.user_id::text = (p_result ->> 'winner_user_id')
          then coalesce(v_home.points, 0) else coalesce(v_away.points, 0) end,
        'opponent_points', case when v_home.user_id::text = (p_result ->> 'winner_user_id')
          then coalesce(v_away.points, 0) else coalesce(v_home.points, 0) end,
        'opponent_name', case when v_home.user_id::text = (p_result ->> 'winner_user_id')
          then v_away_name else v_home_name end,
        'rating_delta', coalesce((p_result -> 'elo' ->> 'winner_delta')::int, 0),
        'new_rating', coalesce((p_result -> 'elo' ->> 'winner_rating')::int, 0),
        'previous_rating', coalesce((p_result -> 'elo' ->> 'winner_rating')::int, 0)
          - coalesce((p_result -> 'elo' ->> 'winner_delta')::int, 0)
      ),
      (p_result ->> 'loser_user_id'), jsonb_build_object(
        'match_id', p_match_id,
        'outcome', 'loss',
        'my_points', case when v_home.user_id::text = (p_result ->> 'loser_user_id')
          then coalesce(v_home.points, 0) else coalesce(v_away.points, 0) end,
        'opponent_points', case when v_home.user_id::text = (p_result ->> 'loser_user_id')
          then coalesce(v_away.points, 0) else coalesce(v_home.points, 0) end,
        'opponent_name', case when v_home.user_id::text = (p_result ->> 'loser_user_id')
          then v_away_name else v_home_name end,
        'rating_delta', coalesce((p_result -> 'elo' ->> 'loser_delta')::int, 0),
        'new_rating', coalesce((p_result -> 'elo' ->> 'loser_rating')::int, 0),
        'previous_rating', coalesce((p_result -> 'elo' ->> 'loser_rating')::int, 0)
          - coalesce((p_result -> 'elo' ->> 'loser_delta')::int, 0)
      )
    );
  end if;

  update public.matches
    set state_json = coalesce(state_json, '{}'::jsonb) || jsonb_build_object('completions', v_completions)
    where id = p_match_id;
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
    perform public.evaluate_achievements(v_home.user_id);
    perform public.evaluate_achievements(v_away.user_id);

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

  perform public.evaluate_achievements(v_home.user_id);
  perform public.evaluate_achievements(v_away.user_id);

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

-- Backfill the Austin vs Haley test match completion summary.
select public.persist_solo_match_completions(
  'b8bd9dac-ab89-4c13-8600-245e3208ffb0'::uuid,
  jsonb_build_object(
    'status', 'completed',
    'result', 'decided',
    'winner_user_id', '8ef1125e-30dc-440c-8662-6234dcfc13b5',
    'loser_user_id', 'a8bf0f12-2465-4f1f-a4b6-efa7d4f4aeb6',
    'home_points', 0,
    'away_points', 1,
    'elo', jsonb_build_object(
      'winner_delta', 16,
      'winner_rating', 1016,
      'loser_delta', -16,
      'loser_rating', 984
    )
  )
);
