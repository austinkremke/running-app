-- Reliable solo match completion fetch + season record in completion payloads.

create or replace function public.get_my_solo_match_completions(
  p_user_id uuid default auth.uid(),
  p_limit int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_results jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(
    jsonb_agg(entry.completion order by entry.ends_at desc),
    '[]'::jsonb
  )
  into v_results
  from (
    select
      m.ends_at,
      m.state_json->'completions'->(p_user_id::text) as completion
    from public.matches m
    join public.match_participants mp on mp.match_id = m.id
    where mp.user_id = p_user_id
      and m.kind = 'solo'
      and m.status = 'completed'
      and (m.state_json->'completions' ? (p_user_id::text))
    order by m.ends_at desc
    limit greatest(p_limit, 1)
  ) entry
  where entry.completion is not null;

  return v_results;
end;
$$;

grant execute on function public.get_my_solo_match_completions(uuid, int) to authenticated;

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
        'previous_rating', (select competitive_rating from public.player_rank where user_id = v_home.user_id),
        'season_wins', (select season_wins from public.player_rank where user_id = v_home.user_id),
        'season_losses', (select season_losses from public.player_rank where user_id = v_home.user_id)
      ),
      v_away.user_id::text, jsonb_build_object(
        'match_id', p_match_id,
        'outcome', 'tie',
        'my_points', coalesce(v_away.points, 0),
        'opponent_points', coalesce(v_home.points, 0),
        'opponent_name', v_home_name,
        'rating_delta', 0,
        'new_rating', (select competitive_rating from public.player_rank where user_id = v_away.user_id),
        'previous_rating', (select competitive_rating from public.player_rank where user_id = v_away.user_id),
        'season_wins', (select season_wins from public.player_rank where user_id = v_away.user_id),
        'season_losses', (select season_losses from public.player_rank where user_id = v_away.user_id)
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
          - coalesce((p_result -> 'elo' ->> 'winner_delta')::int, 0),
        'season_wins', (select season_wins from public.player_rank where user_id = (p_result ->> 'winner_user_id')::uuid),
        'season_losses', (select season_losses from public.player_rank where user_id = (p_result ->> 'winner_user_id')::uuid)
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
          - coalesce((p_result -> 'elo' ->> 'loser_delta')::int, 0),
        'season_wins', (select season_wins from public.player_rank where user_id = (p_result ->> 'loser_user_id')::uuid),
        'season_losses', (select season_losses from public.player_rank where user_id = (p_result ->> 'loser_user_id')::uuid)
      )
    );
  end if;

  update public.matches
    set state_json = coalesce(state_json, '{}'::jsonb) || jsonb_build_object('completions', v_completions)
    where id = p_match_id;
end;
$$;

-- Enrich finalize_due response with season record for the client drawer.
create or replace function public.finalize_due_solo_matches_for_user(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_result jsonb;
  v_results jsonb := '[]'::jsonb;
  v_my_row public.match_participants%rowtype;
  v_opponent_row public.match_participants%rowtype;
  v_opponent_name text;
  v_outcome text;
  v_rating_delta int;
  v_new_rating int;
  v_previous_rating int;
  v_season_wins int;
  v_season_losses int;
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
    v_result := public.finalize_solo_match(v_match_id);

    select *
      into v_my_row
      from public.match_participants
      where match_id = v_match_id
        and user_id = p_user_id;

    select mp.*
      into v_opponent_row
      from public.match_participants mp
      where mp.match_id = v_match_id
        and mp.user_id <> p_user_id
      limit 1;

    select p.display_name
      into v_opponent_name
      from public.profiles p
      where p.id = v_opponent_row.user_id;

    v_opponent_name := coalesce(v_opponent_name, 'Opponent');

    select season_wins, season_losses
      into v_season_wins, v_season_losses
      from public.player_rank
      where user_id = p_user_id;

    if (v_result ->> 'result') = 'tie' then
      v_outcome := 'tie';
      v_rating_delta := 0;
      v_new_rating := (select competitive_rating from public.player_rank where user_id = p_user_id);
      v_previous_rating := v_new_rating;
    elsif (v_result ->> 'winner_user_id')::uuid = p_user_id then
      v_outcome := 'win';
      v_rating_delta := coalesce((v_result -> 'elo' ->> 'winner_delta')::int, 0);
      v_new_rating := coalesce((v_result -> 'elo' ->> 'winner_rating')::int, 0);
      v_previous_rating := v_new_rating - v_rating_delta;
    else
      v_outcome := 'loss';
      v_rating_delta := coalesce((v_result -> 'elo' ->> 'loser_delta')::int, 0);
      v_new_rating := coalesce((v_result -> 'elo' ->> 'loser_rating')::int, 0);
      v_previous_rating := v_new_rating - v_rating_delta;
    end if;

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'match_id', v_match_id,
        'status', v_result ->> 'status',
        'result', v_result ->> 'result',
        'outcome', v_outcome,
        'my_points', coalesce(v_my_row.points, 0),
        'opponent_points', coalesce(v_opponent_row.points, 0),
        'opponent_name', v_opponent_name,
        'rating_delta', v_rating_delta,
        'new_rating', v_new_rating,
        'previous_rating', v_previous_rating,
        'season_wins', coalesce(v_season_wins, 0),
        'season_losses', coalesce(v_season_losses, 0),
        'elo', v_result -> 'elo'
      )
    );
  end loop;

  return v_results;
end;
$$;

grant execute on function public.finalize_due_solo_matches_for_user(uuid) to authenticated;
