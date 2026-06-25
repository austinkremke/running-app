-- Run Off Phase A: profiles, progression, rank catalog, auth provisioning trigger.

create table public.rank_tiers (
  id text primary key,
  display_name text not null,
  subtitle text,
  icon text not null,
  min_rating int not null,
  sort_order int not null
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp bigint not null default 0 check (total_xp >= 0),
  updated_at timestamptz not null default now()
);

create table public.player_rank (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  competitive_rating int not null default 1000,
  season_wins int not null default 0 check (season_wins >= 0),
  season_losses int not null default 0 check (season_losses >= 0),
  updated_at timestamptz not null default now()
);

create index profiles_created_at_idx on public.profiles (created_at);

alter table public.rank_tiers enable row level security;
alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.player_rank enable row level security;

-- Reference catalog: readable by any signed-in user.
create policy "rank_tiers_select_authenticated"
  on public.rank_tiers for select
  to authenticated
  using (true);

-- Profiles: users read all (leaderboards/social later); write own row only.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "player_progress_select_self"
  on public.player_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "player_progress_update_self"
  on public.player_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "player_rank_select_authenticated"
  on public.player_rank for select
  to authenticated
  using (true);

create policy "player_rank_update_self"
  on public.player_rank for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger player_progress_set_updated_at
  before update on public.player_progress
  for each row execute function public.set_updated_at();

create trigger player_rank_set_updated_at
  before update on public.player_rank
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display text;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'runner'
  );

  insert into public.profiles (id, display_name)
  values (new.id, display);

  insert into public.player_progress (user_id, total_xp)
  values (new.id, 0);

  insert into public.player_rank (user_id, competitive_rating)
  values (new.id, 1000);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
