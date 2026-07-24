-- The 20260723000004 backfill decided win/loss/tie from match_participants.points,
-- which turned out to be stale (still 0/1 placeholder values, or plain wrong) for
-- some real completed solo matches whose activities were never re-synced through
-- match_side_points at finalize time. A match with a genuine 23-10 result was
-- stored as 0-0, so the backfill wrongly treated it as a tie and skipped it —
-- excluding it entirely from history instead of just showing the wrong score.
--
-- Fix at the source: recompute every completed solo match's points from
-- activities (the same authoritative match_side_points() finalize_solo_match
-- itself trusts), write the corrected value back, then redo the full rating
-- backfill from a clean slate so nothing already-backfilled is left
-- inconsistent with a newly-discovered non-tie match.
do $$
declare
  v_row record;
  v_match record;
  v_home_rating int;
  v_away_rating int;
  v_home_expected double precision;
  v_away_expected double precision;
  v_home_delta int;
  v_away_delta int;
  v_new_home_rating int;
  v_new_away_rating int;
  v_recomputed_points int;
begin
  -- Step 1: correct match_participants.points from real activities.
  for v_row in
    select mp.match_id, mp.user_id
    from public.match_participants mp
    join public.matches m on m.id = mp.match_id
    where m.kind = 'solo' and m.status = 'completed' and mp.user_id is not null
  loop
    v_recomputed_points := public.match_side_points(v_row.match_id, v_row.user_id);
    update public.match_participants
      set points = v_recomputed_points
      where match_id = v_row.match_id and user_id = v_row.user_id;
  end loop;

  -- Step 2: clean slate, then redo the deterministic Elo replay (see
  -- 20260723000004 for why this reconstructs exact historical ratings).
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
      and home.points <> away.points
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
