-- Milestone distance PRs: 1 mile / 5k / 5 mile / 10k / half marathon / marathon.
-- "Complete it" achievements (mirrors existing five_k/half_marathon/marathon rows)
-- plus a new activity_distance_records table tracking each qualifying run's
-- split time (elapsed time to reach that exact distance, not the whole run),
-- and RPCs to upsert a split and read back gold/silver/bronze (top-3) badges.

insert into public.achievement_definitions
  (id, display_name, description, category, sort_order, tier, icon, xp_reward, criteria_type, criteria_json, is_active)
values
  ('one_mile', '1 Mile', 'Run 1 mile in a single run.', 'performance', 19, 'bronze', 'flag-outline', 150, 'single_run_distance_miles', '{"miles": 1}', true),
  ('five_mile_run', '5 Mile Run', 'Run 5 miles in a single run.', 'performance', 20, 'bronze', 'flag-outline', 250, 'single_run_distance_miles', '{"miles": 5}', true),
  ('ten_k', '10K', 'Run 6.2 miles in a single run.', 'performance', 21, 'silver', 'flag-outline', 300, 'single_run_distance_miles', '{"miles": 6.2}', true)
on conflict (id) do nothing;

create table public.activity_distance_records (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  distance_key text not null check (
    distance_key in ('mile', 'five_k', 'five_mile', 'ten_k', 'half_marathon', 'marathon')
  ),
  split_seconds numeric not null check (split_seconds > 0),
  created_at timestamptz not null default now(),
  unique (activity_id, distance_key)
);

create index activity_distance_records_user_distance_idx
  on public.activity_distance_records (user_id, distance_key, split_seconds);

alter table public.activity_distance_records enable row level security;

-- Readable by anyone authenticated — medal badges render on feed cards and
-- run-detail pages for runs the viewer may not own (same openness as
-- player_rank/achievement_definitions elsewhere in this app).
create policy "activity_distance_records_select_authenticated"
  on public.activity_distance_records for select
  to authenticated
  using (true);

create policy "activity_distance_records_insert_own"
  on public.activity_distance_records for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.activities a
      where a.id = activity_id and a.user_id = auth.uid()
    )
  );

-- Upserts one milestone split for an activity the caller owns.
create or replace function public.upsert_distance_record(
  p_activity_id uuid,
  p_distance_key text,
  p_split_seconds numeric
)
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

  if not exists (
    select 1 from public.activities where id = p_activity_id and user_id = v_user_id
  ) then
    raise exception 'Activity not found for this user';
  end if;

  insert into public.activity_distance_records (activity_id, user_id, distance_key, split_seconds)
  values (p_activity_id, v_user_id, p_distance_key, p_split_seconds)
  on conflict (activity_id, distance_key)
    do update set split_seconds = excluded.split_seconds;
end;
$$;

revoke all on function public.upsert_distance_record(uuid, text, numeric) from public;
grant execute on function public.upsert_distance_record(uuid, text, numeric) to authenticated;

-- Current gold/silver/bronze (rank 1-3) badges among the given activities,
-- each activity's rank computed against that activity owner's FULL history
-- for that distance (not just the activities passed in).
create or replace function public.get_distance_badges(p_activity_ids uuid[])
returns table (activity_id uuid, distance_key text, rnk int)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      adr.activity_id,
      adr.distance_key,
      rank() over (
        partition by adr.user_id, adr.distance_key
        order by adr.split_seconds asc
      ) as rnk
    from public.activity_distance_records adr
    where adr.user_id in (
      select user_id from public.activity_distance_records where activity_id = any(p_activity_ids)
    )
  )
  select ranked.activity_id, ranked.distance_key, ranked.rnk
  from ranked
  where ranked.activity_id = any(p_activity_ids) and ranked.rnk <= 3;
$$;

revoke all on function public.get_distance_badges(uuid[]) from public;
grant execute on function public.get_distance_badges(uuid[]) to authenticated;

-- Top-3 personal records per distance for a user (Me page).
create or replace function public.get_personal_records(p_user_id uuid default auth.uid())
returns table (distance_key text, rnk int, split_seconds numeric, activity_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select distance_key, rnk, split_seconds, activity_id
  from (
    select
      distance_key,
      split_seconds,
      activity_id,
      rank() over (partition by distance_key order by split_seconds asc) as rnk
    from public.activity_distance_records
    where user_id = p_user_id
  ) ranked
  where rnk <= 3
  order by distance_key, rnk;
$$;

revoke all on function public.get_personal_records(uuid) from public;
grant execute on function public.get_personal_records(uuid) to authenticated;
