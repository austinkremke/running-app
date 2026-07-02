-- Allow a solo match participant to forfeit early (counts as a loss).

create or replace function public.forfeit_solo_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.matches%rowtype;
  v_home public.match_participants%rowtype;
  v_away public.match_participants%rowtype;
  v_winner uuid;
  v_loser uuid;
  v_opponent_name text;
  v_elo jsonb;
  v_result jsonb;
  v_rating_delta int;
  v_new_rating int;
  v_previous_rating int;
  v_season_wins int;
  v_season_losses int;
  v_my_points int;
  v_opponent_points int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_match_id is null then
    raise exception 'Match is required';
  end if;

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
    raise exception 'Match participants not found';
  end if;

  if v_user_id not in (v_home.user_id, v_away.user_id) then
    raise exception 'You are not a participant in this match';
  end if;

  v_loser := v_user_id;
  v_winner := case
    when v_home.user_id = v_user_id then v_away.user_id
    else v_home.user_id
  end;

  update public.matches
    set status = 'completed',
        ends_at = least(v_match.ends_at, now()),
        state_json = coalesce(v_match.state_json, '{}'::jsonb) || jsonb_build_object(
          'ended_reason', 'forfeit',
          'forfeited_by', v_user_id
        )
    where id = p_match_id;

  v_elo := public.apply_elo_match_result_system(v_winner, v_loser);

  perform public.evaluate_achievements_system(v_home.user_id);
  perform public.evaluate_achievements_system(v_away.user_id);

  v_result := jsonb_build_object(
    'status', 'completed',
    'result', 'forfeit',
    'winner_user_id', v_winner,
    'loser_user_id', v_loser,
    'home_points', coalesce(v_home.points, 0),
    'away_points', coalesce(v_away.points, 0),
    'elo', v_elo,
    'forfeited_by', v_user_id
  );

  perform public.persist_solo_match_completions(p_match_id, v_result);

  select p.display_name
    into v_opponent_name
    from public.profiles p
    where p.id = v_winner;

  v_opponent_name := coalesce(v_opponent_name, 'Opponent');

  if v_user_id = v_home.user_id then
    v_my_points := coalesce(v_home.points, 0);
    v_opponent_points := coalesce(v_away.points, 0);
  else
    v_my_points := coalesce(v_away.points, 0);
    v_opponent_points := coalesce(v_home.points, 0);
  end if;

  v_rating_delta := coalesce((v_elo ->> 'loser_delta')::int, 0);
  v_new_rating := coalesce((v_elo ->> 'loser_rating')::int, 0);
  v_previous_rating := v_new_rating - v_rating_delta;

  select season_wins, season_losses
    into v_season_wins, v_season_losses
    from public.player_rank
    where user_id = v_user_id;

  return v_result || jsonb_build_object(
    'completion', jsonb_build_object(
      'match_id', p_match_id,
      'outcome', 'loss',
      'my_points', v_my_points,
      'opponent_points', v_opponent_points,
      'opponent_name', v_opponent_name,
      'rating_delta', v_rating_delta,
      'new_rating', v_new_rating,
      'previous_rating', v_previous_rating,
      'season_wins', coalesce(v_season_wins, 0),
      'season_losses', coalesce(v_season_losses, 0)
    )
  );
end;
$$;

grant execute on function public.forfeit_solo_match(uuid) to authenticated;
