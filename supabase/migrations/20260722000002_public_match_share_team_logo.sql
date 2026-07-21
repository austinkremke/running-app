-- get_public_match_share previously fell back to an arbitrary team member's
-- profile avatar for team matches (whichever match_participants row with
-- side='home'/'away' happened to match first) — the share card should show
-- the team's own logo instead, not one random squad member's face.

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
    'homeAvatarUrl', case when ht.id is not null then ht.logo_url else (select avatar_url from home_solo) end,
    'homeLogoIcon', ht.logo_icon,
    'homeLogoAccent', ht.logo_accent,
    'homePoints', (m.state_json->>'home_points')::numeric,
    'awayName', coalesce(at.name, (select name from away_solo)),
    'awayAvatarUrl', case when at.id is not null then at.logo_url else (select avatar_url from away_solo) end,
    'awayLogoIcon', at.logo_icon,
    'awayLogoAccent', at.logo_accent,
    'awayPoints', (m.state_json->>'away_points')::numeric,
    'result', m.state_json->>'result'
  )
  from public.matches m
  left join public.teams ht on ht.id = m.home_team_id
  left join public.teams at on at.id = m.away_team_id
  where m.id = p_match_id;
$$;

grant execute on function public.get_public_match_share(uuid) to anon, authenticated;
