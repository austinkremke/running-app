-- Revert to the pre-cast-fix finalize_team_match (restores the type-mismatch bug — only for symmetry with the migration pair; do not actually run in place of the fix).

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
      sum(public.match_points_for_activity(a.distance_meters, a.duration_seconds))::int as points
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
      sum(public.match_points_for_activity(a.distance_meters, a.duration_seconds))::int as points
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
