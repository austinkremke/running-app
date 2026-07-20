-- Mirrors 20250708000001_team_match_feed_posts.sql for solo (1v1) matches:
-- finalize_solo_match now also records home_points/away_points/result in
-- state_json (it previously only wrote match_participants.points) and
-- inserts a feed_posts row so completed 1v1 matches show up in the feed the
-- same way completed team matches already do.

create policy "feed_posts_select_solo_match"
  on public.feed_posts for select
  to authenticated
  using (
    match_id is not null
    and exists (
      select 1
      from public.matches m
      where m.id = feed_posts.match_id
        and m.kind = 'solo'
        and (
          exists (
            select 1 from public.match_participants mp
            where mp.match_id = m.id
              and mp.user_id = auth.uid()
          )
          or exists (
            select 1 from public.match_participants mp
            where mp.match_id = m.id
              and mp.user_id is not null
              and public.are_friends(auth.uid(), mp.user_id)
          )
        )
    )
  );

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
                (
                  m.kind = 'team'
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
                or (
                  m.kind = 'solo'
                  and (
                    exists (
                      select 1 from public.match_participants mp
                      where mp.match_id = m.id
                        and mp.user_id = auth.uid()
                    )
                    or exists (
                      select 1 from public.match_participants mp
                      where mp.match_id = m.id
                        and mp.user_id is not null
                        and public.are_friends(auth.uid(), mp.user_id)
                    )
                  )
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

-- Backfill: create the feed post + state_json result for any solo match
-- that already completed before this migration shipped.
update public.matches m
set state_json = coalesce(state_json, '{}'::jsonb)
  || jsonb_build_object(
    'result',
    case
      when mp_home.points = mp_away.points then 'tie'
      when mp_home.points > mp_away.points then 'home'
      else 'away'
    end,
    'home_points', coalesce(mp_home.points, 0),
    'away_points', coalesce(mp_away.points, 0)
  )
from public.match_participants mp_home, public.match_participants mp_away
where m.kind = 'solo'
  and m.status = 'completed'
  and mp_home.match_id = m.id and mp_home.side = 'home'
  and mp_away.match_id = m.id and mp_away.side = 'away'
  and not (m.state_json ? 'result');

insert into public.feed_posts (match_id, audiences)
select m.id, '{}'::text[]
from public.matches m
where m.kind = 'solo'
  and m.status = 'completed'
  and not exists (select 1 from public.feed_posts fp where fp.match_id = m.id);
