-- Competitive History (premium): an Elo-over-time graph of a player's solo
-- ranked matches. `apply_elo_match_result_system` already computes each
-- side's new rating/delta at finalize/forfeit time but never persisted it —
-- only the *current* `player_rank.competitive_rating` survives, so there was
-- no way to reconstruct rating at a past point in time. These columns snapshot
-- it per match, per participant, at the moment their rating changed.
alter table public.match_participants
  add column if not exists rating_before int,
  add column if not exists rating_after int,
  add column if not exists rating_delta int;

create or replace function public.record_match_rating_change(
  p_match_id uuid,
  p_user_id uuid,
  p_new_rating int,
  p_delta int
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.match_participants
    set rating_after = p_new_rating,
        rating_delta = p_delta,
        rating_before = p_new_rating - p_delta
    where match_id = p_match_id and user_id = p_user_id;
$$;

revoke all on function public.record_match_rating_change(uuid, uuid, int, int) from public;

-- Re-declare finalize_solo_match (latest prior definition:
-- 20260721000001_solo_match_feed_posts.sql) to additionally snapshot each
-- side's rating change once Elo has been applied.
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

-- Re-declare forfeit_solo_match (latest prior definition:
-- 20250625000007_solo_match_forfeit.sql) with the same rating snapshot.
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

-- Competitive History: this user's completed solo matches with the rating
-- snapshot at that point in time, newest first. Rows finalized before this
-- migration have null rating_before/after/delta (no rating history exists
-- for them) — the client filters those out rather than guessing.
create or replace function public.get_solo_rating_history(
  p_user_id uuid default auth.uid(),
  p_limit int default 50
)
returns table (
  match_id uuid,
  ended_at timestamptz,
  result text,
  my_points numeric,
  opponent_points numeric,
  opponent_id uuid,
  opponent_name text,
  opponent_avatar_url text,
  rating_before int,
  rating_after int,
  rating_delta int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id as match_id,
    m.ends_at as ended_at,
    case
      when mine.points > theirs.points then 'win'
      when mine.points < theirs.points then 'loss'
      else 'tie'
    end as result,
    mine.points as my_points,
    theirs.points as opponent_points,
    theirs.user_id as opponent_id,
    p.display_name as opponent_name,
    p.avatar_url as opponent_avatar_url,
    mine.rating_before,
    mine.rating_after,
    mine.rating_delta
  from public.matches m
  join public.match_participants mine
    on mine.match_id = m.id and mine.user_id = p_user_id
  join public.match_participants theirs
    on theirs.match_id = m.id and theirs.user_id is not null and theirs.user_id <> p_user_id
  left join public.profiles p on p.id = theirs.user_id
  where m.kind = 'solo'
    and m.status = 'completed'
    and mine.rating_after is not null
  order by m.ends_at desc
  limit p_limit;
$$;

revoke all on function public.get_solo_rating_history(uuid, int) from public;
grant execute on function public.get_solo_rating_history(uuid, int) to authenticated;
