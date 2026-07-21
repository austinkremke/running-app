-- get_public_match_share read solo-match scores from matches.state_json,
-- which the client deliberately stopped trusting for 1v1 matches
-- (20260720000003_finalize_solo_match_recompute_points.sql) — it can be
-- stale/wrong because it's only written once at finalize time. The app
-- itself always recomputes solo points live from activities via
-- match_side_points(); this RPC needs to do the same or the public share
-- page shows a different (and often 0-0) score than what got shared.
-- Team matches are unaffected — state_json.home_points/away_points is still
-- the correct source there (fetchTeamMatchFeedPosts reads it directly).

create or replace function public.get_public_match_share(p_match_id uuid)
returns json
language sql
security definer
stable
set search_path = public
as $$
  with home_solo as (
    select mp.user_id, pp.display_name as name, pp.avatar_url
    from public.match_participants mp
    join public.profiles pp on pp.id = mp.user_id
    where mp.match_id = p_match_id and mp.side = 'home'
    limit 1
  ),
  away_solo as (
    select mp.user_id, pp.display_name as name, pp.avatar_url
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
    'homePoints', case
      when m.kind = 'solo' then public.match_side_points(m.id, (select user_id from home_solo))
      else (m.state_json->>'home_points')::numeric
    end,
    'awayName', coalesce(at.name, (select name from away_solo)),
    'awayAvatarUrl', case when at.id is not null then at.logo_url else (select avatar_url from away_solo) end,
    'awayLogoIcon', at.logo_icon,
    'awayLogoAccent', at.logo_accent,
    'awayPoints', case
      when m.kind = 'solo' then public.match_side_points(m.id, (select user_id from away_solo))
      else (m.state_json->>'away_points')::numeric
    end,
    'result', case
      when m.kind = 'solo' then
        case
          when public.match_side_points(m.id, (select user_id from home_solo))
             = public.match_side_points(m.id, (select user_id from away_solo)) then 'tie'
          when public.match_side_points(m.id, (select user_id from home_solo))
             > public.match_side_points(m.id, (select user_id from away_solo)) then 'home'
          else 'away'
        end
      else m.state_json->>'result'
    end
  )
  from public.matches m
  left join public.teams ht on ht.id = m.home_team_id
  left join public.teams at on at.id = m.away_team_id
  where m.id = p_match_id;
$$;

grant execute on function public.get_public_match_share(uuid) to anon, authenticated;
