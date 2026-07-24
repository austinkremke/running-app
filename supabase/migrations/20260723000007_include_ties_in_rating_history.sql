-- Ties never call apply_elo_match_result_system (correct — a tie doesn't move
-- Elo) but that also meant they never got a rating snapshot at all, so
-- get_solo_rating_history silently dropped them from history entirely. A tie
-- should still show up as a data point on the graph — just a flat segment
-- (rating_before = rating_after, delta = 0) — not vanish.

-- Re-declare finalize_solo_match (latest prior definition: 20260723000003) to
-- snapshot the tie branch too, using each side's *current* player_rank rating.
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
  v_result_key text;
  v_home_rating int;
  v_away_rating int;
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
    v_result_key := 'tie';
  elsif v_home_points > v_away_points then
    v_result_key := 'home';
  else
    v_result_key := 'away';
  end if;

  update public.matches
    set state_json = coalesce(state_json, '{}'::jsonb)
      || jsonb_build_object(
        'result', v_result_key,
        'home_points', v_home_points,
        'away_points', v_away_points
      )
    where id = p_match_id;

  insert into public.feed_posts (match_id, audiences)
  values (p_match_id, '{}'::text[])
  on conflict (match_id) where match_id is not null do nothing;

  if v_result_key = 'tie' then
    select competitive_rating into v_home_rating from public.player_rank where user_id = v_home.user_id;
    select competitive_rating into v_away_rating from public.player_rank where user_id = v_away.user_id;

    perform public.record_match_rating_change(p_match_id, v_home.user_id, coalesce(v_home_rating, 1000), 0);
    perform public.record_match_rating_change(p_match_id, v_away.user_id, coalesce(v_away_rating, 1000), 0);

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

  perform public.record_match_rating_change(
    p_match_id, v_winner, (v_elo ->> 'winner_rating')::int, (v_elo ->> 'winner_delta')::int
  );
  perform public.record_match_rating_change(
    p_match_id, v_loser, (v_elo ->> 'loser_rating')::int, (v_elo ->> 'loser_delta')::int
  );

  perform public.evaluate_achievements_system(v_home.user_id);
  perform public.evaluate_achievements_system(v_away.user_id);

  v_result := jsonb_build_object(
    'status', 'completed',
    'result', 'decided',
    'winner_user_id', v_winner,
    'loser_user_id', v_loser,
    'home_user_id', v_home.user_id,
    'away_user_id', v_away.user_id,
    'home_points', v_home_points,
    'away_points', v_away_points,
    'elo', v_elo
  );

  perform public.persist_solo_match_completions(p_match_id, v_result);
  return v_result;
end;
$$;

-- Redo the deterministic backfill (clean slate) so ties get folded into the
-- same chronological replay and correctly carry the running rating forward
-- unchanged, instead of being skipped.
do $$
declare
  v_match record;
  v_home_rating int;
  v_away_rating int;
  v_home_expected double precision;
  v_away_expected double precision;
  v_home_delta int;
  v_away_delta int;
  v_new_home_rating int;
  v_new_away_rating int;
begin
  update public.match_participants mp
    set rating_before = null, rating_after = null, rating_delta = null
    from public.matches m
    where m.id = mp.match_id and m.kind = 'solo';

  create temporary table tmp_solo_ratings (
    user_id uuid primary key,
    rating int not null
  ) on commit drop;

  for v_match in
    select
      m.id as match_id,
      home.user_id as home_user_id,
      away.user_id as away_user_id,
      home.points as home_points,
      away.points as away_points
    from public.matches m
    join public.match_participants home on home.match_id = m.id and home.side = 'home'
    join public.match_participants away on away.match_id = m.id and away.side = 'away'
    where m.kind = 'solo'
      and m.status = 'completed'
      and home.user_id is not null
      and away.user_id is not null
      and home.points is not null
      and away.points is not null
    order by m.ends_at asc, m.id asc
  loop
    select rating into v_home_rating from tmp_solo_ratings where user_id = v_match.home_user_id;
    if not found then
      v_home_rating := 1000;
      insert into tmp_solo_ratings (user_id, rating) values (v_match.home_user_id, v_home_rating);
    end if;

    select rating into v_away_rating from tmp_solo_ratings where user_id = v_match.away_user_id;
    if not found then
      v_away_rating := 1000;
      insert into tmp_solo_ratings (user_id, rating) values (v_match.away_user_id, v_away_rating);
    end if;

    if v_match.home_points = v_match.away_points then
      v_home_delta := 0;
      v_away_delta := 0;
      v_new_home_rating := v_home_rating;
      v_new_away_rating := v_away_rating;
    else
      v_home_expected := public.elo_expected_score(v_home_rating, v_away_rating);
      v_away_expected := public.elo_expected_score(v_away_rating, v_home_rating);

      if v_match.home_points > v_match.away_points then
        v_home_delta := round(32 * (1.0 - v_home_expected))::int;
        v_away_delta := round(32 * (0.0 - v_away_expected))::int;
      else
        v_home_delta := round(32 * (0.0 - v_home_expected))::int;
        v_away_delta := round(32 * (1.0 - v_away_expected))::int;
      end if;

      v_new_home_rating := greatest(0, v_home_rating + v_home_delta);
      v_new_away_rating := greatest(0, v_away_rating + v_away_delta);
    end if;

    update public.match_participants
      set rating_before = v_home_rating, rating_after = v_new_home_rating, rating_delta = v_home_delta
      where match_id = v_match.match_id and side = 'home';

    update public.match_participants
      set rating_before = v_away_rating, rating_after = v_new_away_rating, rating_delta = v_away_delta
      where match_id = v_match.match_id and side = 'away';

    update tmp_solo_ratings set rating = v_new_home_rating where user_id = v_match.home_user_id;
    update tmp_solo_ratings set rating = v_new_away_rating where user_id = v_match.away_user_id;
  end loop;

  for v_match in
    select pr.user_id, pr.competitive_rating as live_rating, t.rating as replayed_rating
    from public.player_rank pr
    join tmp_solo_ratings t on t.user_id = pr.user_id
    where pr.competitive_rating <> t.rating
  loop
    raise notice 'Rating replay mismatch for user %: live=%, replayed=%',
      v_match.user_id, v_match.live_rating, v_match.replayed_rating;
  end loop;
end;
$$;
