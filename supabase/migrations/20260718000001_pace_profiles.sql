-- Premium Pace Distribution analytics (run detail): personalized pace-range
-- boundaries cached per user so the client doesn't rescan 90 days of tracks
-- on every activity detail view. Computed client-side from smoothed moving
-- pace pooled across recent runs; this table only stores the result.

create table public.user_pace_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  recovery_threshold_sec numeric not null,
  easy_threshold_sec numeric not null,
  workout_threshold_sec numeric not null,
  run_count integer not null default 0,
  sample_count integer not null default 0,
  confidence text not null check (confidence in ('high', 'moderate', 'limited')),
  computed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_pace_profiles enable row level security;

create policy "user_pace_profiles_select_self"
  on public.user_pace_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_pace_profiles_insert_self"
  on public.user_pace_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_pace_profiles_update_self"
  on public.user_pace_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger user_pace_profiles_set_updated_at
  before update on public.user_pace_profiles
  for each row execute function public.set_updated_at();
