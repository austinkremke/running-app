-- Reverts get_public_match_share to the prior version without team logo fields.
create or replace function public.get_public_match_share(p_match_id uuid)
returns json
language sql
security definer
stable
set search_path = public
as $$
  with home_solo as (
    select pp.display_name as name, pp.avatar_url
    from public.match_participants mp
    join public.profiles pp on pp.id = mp.user_id
    where mp.match_id = p_match_id and mp.side = 'home'
    limit 1
  ),
  away_solo as (
    select pp.display_name as name, pp.avatar_url
    from public.match_participants mp
    join public.profiles pp on pp.id = mp.user_id
    where mp.match_id = p_match_id and mp.side = 'away'
    limit 1
  )
  select json_build_object(
    'kind', m.kind,
    'endsAt', m.ends_at,
    'homeName', coalesce(ht.name, (select name from home_solo)),
    'homeAvatarUrl', (select avatar_url from home_solo),
    'homePoints', (m.state_json->>'home_points')::numeric,
    'awayName', coalesce(at.name, (select name from away_solo)),
    'awayAvatarUrl', (select avatar_url from away_solo),
    'awayPoints', (m.state_json->>'away_points')::numeric,
    'result', m.state_json->>'result'
  )
  from public.matches m
  left join public.teams ht on ht.id = m.home_team_id
  left join public.teams at on at.id = m.away_team_id
  where m.id = p_match_id;
$$;

grant execute on function public.get_public_match_share(uuid) to anon, authenticated;
