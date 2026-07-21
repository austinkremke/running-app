-- Public "share this run/match" landing pages on getrunoff.com need to read a
-- narrow slice of data with NO session — the person clicking a shared link
-- from Facebook (or anywhere else) has never signed in. These two functions
-- expose only what the app's own feed cards already show publicly to any
-- signed-in user (run stats, match result, display name/avatar/team name) —
-- nothing not already visible in the feed — via SECURITY DEFINER so RLS on
-- the underlying tables doesn't block the anon role.

create or replace function public.get_public_run_share(p_feed_post_id uuid)
returns json
language sql
security definer
stable
set search_path = public
as $$
  select json_build_object(
    'kind', 'run',
    'title', fp.title,
    'description', fp.description,
    'createdAt', fp.created_at,
    'runnerName', p.display_name,
    'runnerAvatarUrl', p.avatar_url,
    'teamName', t.name,
    'distanceMeters', a.distance_meters,
    'durationSeconds', a.duration_seconds,
    'startedAt', a.started_at,
    'polyline', a.polyline
  )
  from public.feed_posts fp
  join public.profiles p on p.id = fp.user_id
  join public.activities a on a.id = fp.activity_id
  left join public.teams t on t.id = p.team_id
  where fp.id = p_feed_post_id;
$$;

grant execute on function public.get_public_run_share(uuid) to anon, authenticated;

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
