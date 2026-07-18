-- Durable "has this user seen this match's completion drawer" tracking.
-- Previously this was purely client-side AsyncStorage, so a fresh install
-- had no history and every historical completed match the fetch RPCs
-- returned looked "new," replaying every past result drawer at once.

create table if not exists public.match_completion_acks (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  acked_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.match_completion_acks enable row level security;

create policy "Users can view their own completion acks"
  on public.match_completion_acks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own completion acks"
  on public.match_completion_acks for insert
  with check (auth.uid() = user_id);

create or replace function public.ack_match_completion(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.match_completion_acks (match_id, user_id)
  values (p_match_id, v_user_id)
  on conflict (match_id, user_id) do nothing;
end;
$$;

grant execute on function public.ack_match_completion(uuid) to authenticated;

-- Backfill acks for every completion that already exists as of this
-- migration, so this ship doesn't itself cause every existing user's
-- history to replay once — only completions from here on are "new."

insert into public.match_completion_acks (match_id, user_id, acked_at)
select m.id, key::uuid, now()
from public.matches m
cross join lateral jsonb_object_keys(m.state_json -> 'completions') as key
where m.kind = 'solo'
  and m.status = 'completed'
on conflict (match_id, user_id) do nothing;

insert into public.match_completion_acks (match_id, user_id, acked_at)
select distinct m.id, tm.user_id, now()
from public.matches m
cross join lateral jsonb_object_keys(m.state_json -> 'completions') as team_key
join public.team_members tm on tm.team_id = team_key::uuid
where m.kind = 'team'
  and m.status = 'completed'
on conflict (match_id, user_id) do nothing;

-- Exclude already-acked matches from both completion feeds.

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
      and not exists (
        select 1 from public.match_completion_acks a
        where a.match_id = m.id and a.user_id = p_user_id
      )
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
      and not exists (
        select 1 from public.match_completion_acks a
        where a.match_id = m.id and a.user_id = p_user_id
      )
    order by m.ends_at desc
    limit greatest(p_limit, 1)
  ) entry
  where entry.completion is not null;

  return v_results;
end;
$$;
