-- Return rich solo match completion payloads for the client result screen.

drop function if exists public.finalize_due_solo_matches_for_user(uuid);

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
        'elo', v_result -> 'elo'
      )
    );
  end loop;

  return v_results;
end;
$$;

grant execute on function public.finalize_due_solo_matches_for_user(uuid) to authenticated;
