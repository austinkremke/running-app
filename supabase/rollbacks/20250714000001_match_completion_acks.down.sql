create or replace function public.get_my_solo_match_completions(
  p_user_id uuid default auth.uid(),
  p_limit int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_results jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(
    jsonb_agg(entry.completion order by entry.ends_at desc),
    '[]'::jsonb
  )
  into v_results
  from (
    select
      m.ends_at,
      m.state_json->'completions'->(p_user_id::text) as completion
    from public.matches m
    join public.match_participants mp on mp.match_id = m.id
    where mp.user_id = p_user_id
      and m.kind = 'solo'
      and m.status = 'completed'
      and (m.state_json->'completions' ? (p_user_id::text))
    order by m.ends_at desc
    limit greatest(p_limit, 1)
  ) entry
  where entry.completion is not null;

  return v_results;
end;
$$;

create or replace function public.get_my_team_match_completions(
  p_user_id uuid default auth.uid(),
  p_limit int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_results jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select team_id into v_team_id from public.team_members where user_id = p_user_id limit 1;

  if v_team_id is null then
    return v_results;
  end if;

  select coalesce(jsonb_agg(entry.completion order by entry.ends_at desc), '[]'::jsonb)
    into v_results
  from (
    select
      m.ends_at,
      m.state_json -> 'completions' -> v_team_id::text as completion
    from public.matches m
    where m.kind = 'team'
      and m.status = 'completed'
      and v_team_id in (m.home_team_id, m.away_team_id)
      and (m.state_json -> 'completions' ? v_team_id::text)
    order by m.ends_at desc
    limit greatest(p_limit, 1)
  ) entry
  where entry.completion is not null;

  return v_results;
end;
$$;

drop function if exists public.ack_match_completion(uuid);
drop table if exists public.match_completion_acks;
