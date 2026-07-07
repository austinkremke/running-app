-- Completed team matches get a feed_posts row (created by finalize_team_match
-- itself, not a client insert) so match results reuse the existing
-- feed_reactions/feed_comments infrastructure for free. Visibility is
-- restricted to: the viewer is on either team in the match, OR the viewer
-- is friends with someone on either team — never public/community.

alter table public.feed_posts alter column activity_id drop not null;
alter table public.feed_posts alter column user_id drop not null;

alter table public.feed_posts
  add column match_id uuid references public.matches (id) on delete cascade;

alter table public.feed_posts
  add constraint feed_posts_activity_or_match_chk
  check ((activity_id is not null) <> (match_id is not null));

create unique index feed_posts_match_id_idx
  on public.feed_posts (match_id)
  where match_id is not null;

-- RLS is permissive/OR'd — this is additive alongside the existing
-- author-scoped policies, which never match a match_id row (user_id is null
-- on those rows) so there's no risk of leaking match posts through them.
create policy "feed_posts_select_team_match"
  on public.feed_posts for select
  to authenticated
  using (
    match_id is not null
    and exists (
      select 1
      from public.matches m
      where m.id = feed_posts.match_id
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
  );

-- Extend can_view_feed_post (gates feed_reactions/feed_comments) with the
-- same match-post visibility rule, so likes/comments work on match posts.
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

-- Re-ship finalize_team_match to also create the match's feed post the
-- first time it completes. audiences is left empty ('{}') — visibility for
-- match posts is governed entirely by feed_posts_select_team_match /
-- can_view_feed_post above, not the audience-tag policies (which have no
-- author to check against a null user_id anyway).
create or replace function public.finalize_team_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_home_top jsonb;
  v_away_top jsonb;
  v_home_points int;
  v_away_points int;
  v_result text;
  v_elo jsonb;
  v_home_name text;
  v_away_name text;
  v_completions jsonb;
begin
  select *
    into v_match
    from public.matches
    where id = p_match_id
      and kind = 'team'
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

  if v_match.home_team_id is null or v_match.away_team_id is null then
    update public.matches set status = 'cancelled' where id = p_match_id;
    return jsonb_build_object('status', 'cancelled_missing_team');
  end if;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb), coalesce(sum(t.points), 0)
    into v_home_top, v_home_points
  from (
    select
      tm.user_id,
      p.display_name,
      sum(public.match_points_for_activity(a.distance_meters::numeric, a.duration_seconds::numeric))::int as points
    from public.team_members tm
    join public.profiles p on p.id = tm.user_id
    left join public.activities a
      on a.user_id = tm.user_id
      and a.started_at >= v_match.created_at
      and a.started_at <= v_match.ends_at
    where tm.team_id = v_match.home_team_id
    group by tm.user_id, p.display_name
    order by points desc
    limit 5
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb), coalesce(sum(t.points), 0)
    into v_away_top, v_away_points
  from (
    select
      tm.user_id,
      p.display_name,
      sum(public.match_points_for_activity(a.distance_meters::numeric, a.duration_seconds::numeric))::int as points
    from public.team_members tm
    join public.profiles p on p.id = tm.user_id
    left join public.activities a
      on a.user_id = tm.user_id
      and a.started_at >= v_match.created_at
      and a.started_at <= v_match.ends_at
    where tm.team_id = v_match.away_team_id
    group by tm.user_id, p.display_name
    order by points desc
    limit 5
  ) t;

  if v_home_points > v_away_points then
    v_result := 'home';
  elsif v_away_points > v_home_points then
    v_result := 'away';
  else
    v_result := 'tie';
  end if;

  if v_result = 'home' then
    v_elo := public.apply_team_elo_match_result_system(v_match.home_team_id, v_match.away_team_id);
  elsif v_result = 'away' then
    v_elo := public.apply_team_elo_match_result_system(v_match.away_team_id, v_match.home_team_id);
  else
    v_elo := null;
  end if;

  select name into v_home_name from public.teams where id = v_match.home_team_id;
  select name into v_away_name from public.teams where id = v_match.away_team_id;
  v_home_name := coalesce(v_home_name, 'Opponent');
  v_away_name := coalesce(v_away_name, 'Opponent');

  v_completions := jsonb_build_object(
    v_match.home_team_id::text, jsonb_build_object(
      'match_id', p_match_id,
      'outcome', case v_result when 'home' then 'win' when 'away' then 'loss' else 'tie' end,
      'my_points', v_home_points,
      'opponent_points', v_away_points,
      'opponent_team_id', v_match.away_team_id,
      'opponent_team_name', v_away_name,
      'top_scorers', v_home_top,
      'rating_delta', case v_result
        when 'home' then coalesce((v_elo ->> 'winner_delta')::int, 0)
        when 'away' then coalesce((v_elo ->> 'loser_delta')::int, 0)
        else 0
      end,
      'new_rating', coalesce(
        case v_result
          when 'home' then (v_elo ->> 'winner_rating')::int
          when 'away' then (v_elo ->> 'loser_rating')::int
          else null
        end,
        (select competitive_rating from public.team_rank where team_id = v_match.home_team_id)
      ),
      'season_wins', (select season_wins from public.team_rank where team_id = v_match.home_team_id),
      'season_losses', (select season_losses from public.team_rank where team_id = v_match.home_team_id)
    ),
    v_match.away_team_id::text, jsonb_build_object(
      'match_id', p_match_id,
      'outcome', case v_result when 'away' then 'win' when 'home' then 'loss' else 'tie' end,
      'my_points', v_away_points,
      'opponent_points', v_home_points,
      'opponent_team_id', v_match.home_team_id,
      'opponent_team_name', v_home_name,
      'top_scorers', v_away_top,
      'rating_delta', case v_result
        when 'away' then coalesce((v_elo ->> 'winner_delta')::int, 0)
        when 'home' then coalesce((v_elo ->> 'loser_delta')::int, 0)
        else 0
      end,
      'new_rating', coalesce(
        case v_result
          when 'away' then (v_elo ->> 'winner_rating')::int
          when 'home' then (v_elo ->> 'loser_rating')::int
          else null
        end,
        (select competitive_rating from public.team_rank where team_id = v_match.away_team_id)
      ),
      'season_wins', (select season_wins from public.team_rank where team_id = v_match.away_team_id),
      'season_losses', (select season_losses from public.team_rank where team_id = v_match.away_team_id)
    )
  );

  update public.matches
    set status = 'completed',
        state_json = coalesce(state_json, '{}'::jsonb)
          || jsonb_build_object(
            'result', v_result,
            'home_points', v_home_points,
            'away_points', v_away_points,
            'completions', v_completions
          )
    where id = p_match_id;

  insert into public.feed_posts (match_id, audiences)
  values (p_match_id, '{}'::text[])
  on conflict (match_id) where match_id is not null do nothing;

  return jsonb_build_object(
    'status', 'completed',
    'result', v_result,
    'home_team_id', v_match.home_team_id,
    'away_team_id', v_match.away_team_id,
    'home_points', v_home_points,
    'away_points', v_away_points,
    'completions', v_completions
  );
end;
$$;

-- Backfill: create the feed post for any team match that already completed
-- before this migration shipped (finalize_team_match couldn't insert one yet).
insert into public.feed_posts (match_id, audiences)
select m.id, '{}'::text[]
from public.matches m
where m.kind = 'team'
  and m.status = 'completed'
  and not exists (select 1 from public.feed_posts fp where fp.match_id = m.id);
