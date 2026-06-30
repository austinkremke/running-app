-- Milestone 05 Phase 2: server-authoritative Elo updates for player_rank.

drop policy if exists "player_rank_update_self" on public.player_rank;

create or replace function public.elo_expected_score(p_rating_a int, p_rating_b int)
returns double precision
language sql
immutable
as $$
  select 1.0 / (1.0 + power(10.0, (p_rating_b - p_rating_a)::double precision / 400.0));
$$;

create or replace function public.apply_elo_match_result(
  p_winner_user_id uuid,
  p_loser_user_id uuid,
  p_k_factor int default 32
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_winner public.player_rank%rowtype;
  v_loser public.player_rank%rowtype;
  v_winner_expected double precision;
  v_loser_expected double precision;
  v_winner_delta int;
  v_loser_delta int;
  v_winner_rating int;
  v_loser_rating int;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if p_winner_user_id is null or p_loser_user_id is null then
    raise exception 'Winner and loser are required';
  end if;

  if p_winner_user_id = p_loser_user_id then
    raise exception 'Winner and loser must be different users';
  end if;

  if v_caller not in (p_winner_user_id, p_loser_user_id) then
    raise exception 'Caller must be a match participant';
  end if;

  if p_k_factor < 1 or p_k_factor > 64 then
    raise exception 'Invalid K-factor';
  end if;

  select *
    into v_winner
    from public.player_rank
    where user_id = p_winner_user_id
    for update;

  if not found then
    raise exception 'Winner rank row not found';
  end if;

  select *
    into v_loser
    from public.player_rank
    where user_id = p_loser_user_id
    for update;

  if not found then
    raise exception 'Loser rank row not found';
  end if;

  v_winner_expected := public.elo_expected_score(v_winner.competitive_rating, v_loser.competitive_rating);
  v_loser_expected := public.elo_expected_score(v_loser.competitive_rating, v_winner.competitive_rating);

  v_winner_delta := round(p_k_factor * (1.0 - v_winner_expected))::int;
  v_loser_delta := round(p_k_factor * (0.0 - v_loser_expected))::int;

  v_winner_rating := greatest(0, v_winner.competitive_rating + v_winner_delta);
  v_loser_rating := greatest(0, v_loser.competitive_rating + v_loser_delta);

  update public.player_rank
    set competitive_rating = v_winner_rating,
        season_wins = season_wins + 1
    where user_id = p_winner_user_id;

  update public.player_rank
    set competitive_rating = v_loser_rating,
        season_losses = season_losses + 1
    where user_id = p_loser_user_id;

  return jsonb_build_object(
    'winner_user_id', p_winner_user_id,
    'loser_user_id', p_loser_user_id,
    'winner_rating', v_winner_rating,
    'loser_rating', v_loser_rating,
    'winner_delta', v_winner_delta,
    'loser_delta', v_loser_delta
  );
end;
$$;

revoke all on function public.apply_elo_match_result(uuid, uuid, int) from public;
grant execute on function public.apply_elo_match_result(uuid, uuid, int) to authenticated;
