drop policy if exists "feed_posts_select_solo_match" on public.feed_posts;

delete from public.feed_posts fp
using public.matches m
where fp.match_id = m.id
  and m.kind = 'solo';

create or replace function public.can_view_feed_post(p_post_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.feed_posts fp
    where fp.id = p_post_id
      and (
        fp.user_id = auth.uid()
        or 'community' = any (fp.audiences)
        or (
          'friends' = any (fp.audiences)
          and public.are_friends(auth.uid(), fp.user_id)
        )
        or (
          'team' = any (fp.audiences)
          and exists (
            select 1
            from public.team_members viewer
            inner join public.team_members author on author.team_id = viewer.team_id
            where viewer.user_id = auth.uid()
              and author.user_id = fp.user_id
          )
        )
        or (
          fp.match_id is not null
          and exists (
            select 1
            from public.matches m
            where m.id = fp.match_id
              and (
                exists (
                  select 1 from public.team_members tm
                  where tm.user_id = auth.uid()
                    and tm.team_id in (m.home_team_id, m.away_team_id)
                )
                or exists (
                  select 1 from public.team_members tm
                  where tm.team_id in (m.home_team_id, m.away_team_id)
                    and public.are_friends(auth.uid(), tm.user_id)
                )
              )
          )
        )
      )
  );
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
  v_home_points int;
  v_away_points int;
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

  v_home_points := public.match_side_points(p_match_id, v_home.user_id);
  v_away_points := public.match_side_points(p_match_id, v_away.user_id);

  update public.match_participants set points = v_home_points
    where match_id = p_match_id and side = 'home';
  update public.match_participants set points = v_away_points
    where match_id = p_match_id and side = 'away';

  if v_home_points = v_away_points then
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

  perform public.evaluate_achievements_system(v_home.user_id);
  perform public.evaluate_achievements_system(v_away.user_id);

  v_result := jsonb_build_object(
    'status', 'completed',
    'result', 'decided',
    'winner_user_id', v_winner,
    'loser_user_id', v_loser,
    'home_points', v_home_points,
    'away_points', v_away_points,
    'elo', v_elo
  );

  perform public.persist_solo_match_completions(p_match_id, v_result);
  return v_result;
end;
$$;
