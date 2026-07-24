-- Backfill match_participants.rating_before/after/delta for solo matches that
-- completed before 20260723000003 added those columns.
--
-- This works because Elo is fully deterministic and player_rank.competitive_rating
-- is *only* ever moved by apply_elo_match_result(_system) — both defined here and
-- called nowhere else (verified: no other migration updates player_rank.competitive_rating).
-- So replaying every completed solo match in chronological order, starting every
-- player at the same default rating (1000, per player_rank's column default) and
-- applying the same K=32 formula, reconstructs each match's exact historical
-- rating snapshot — not an approximation.
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
      and home.rating_after is null
      and away.rating_after is null
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

  -- Sanity check, not a hard failure: if replaying every match lands on the
  -- same rating `player_rank` already has, the backfilled history is exact.
  -- A mismatch would mean something other than solo-match Elo touched
  -- competitive_rating for that user — surfaced here for manual follow-up,
  -- not blocked, since this migration never writes to player_rank itself.
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
