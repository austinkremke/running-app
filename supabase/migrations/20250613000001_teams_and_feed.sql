-- Run Off Phase C: teams, memberships, feed posts linked to activities.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null unique,
  motto text not null default '',
  logo_icon text not null default 'paw',
  logo_accent text not null default 'lime',
  member_max int not null default 30 check (member_max > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'co-leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (user_id)
);

alter table public.profiles
  add column team_id uuid references public.teams (id) on delete set null;

create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  title text not null default '',
  description text not null default '',
  location text not null default '',
  photo_url text,
  audiences text[] not null default array['community']::text[]
    check (audiences <@ array['community', 'friends', 'team']::text[]),
  created_at timestamptz not null default now(),
  unique (activity_id)
);

create index teams_created_at_idx on public.teams (created_at desc);
create index team_members_team_id_idx on public.team_members (team_id);
create index feed_posts_created_at_idx on public.feed_posts (created_at desc);
create index feed_posts_audiences_idx on public.feed_posts using gin (audiences);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.feed_posts enable row level security;

-- Teams: readable by any signed-in user; writes via migrations/seeds for now.
create policy "teams_select_authenticated"
  on public.teams for select
  to authenticated
  using (true);

create policy "team_members_select_authenticated"
  on public.team_members for select
  to authenticated
  using (true);

create policy "team_members_insert_self"
  on public.team_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "team_members_delete_self"
  on public.team_members for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

create or replace function public.enforce_team_capacity()
returns trigger
language plpgsql
as $$
declare
  current_count int;
  max_members int;
begin
  select count(*) into current_count
  from public.team_members
  where team_id = new.team_id;

  select member_max into max_members
  from public.teams
  where id = new.team_id;

  if current_count >= max_members then
    raise exception 'Team is full';
  end if;

  return new;
end;
$$;

create trigger team_members_enforce_capacity
  before insert on public.team_members
  for each row execute function public.enforce_team_capacity();

create or replace function public.sync_profile_team_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
    set team_id = new.team_id
    where id = new.user_id;
  elsif tg_op = 'DELETE' then
    update public.profiles
    set team_id = null
    where id = old.user_id;
  elsif tg_op = 'UPDATE' then
    update public.profiles
    set team_id = new.team_id
    where id = new.user_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger team_members_sync_profile
  after insert or update or delete on public.team_members
  for each row execute function public.sync_profile_team_membership();

-- Feed posts
create policy "feed_posts_select_own"
  on public.feed_posts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "feed_posts_select_community"
  on public.feed_posts for select
  to authenticated
  using ('community' = any (audiences));

create policy "feed_posts_select_team"
  on public.feed_posts for select
  to authenticated
  using (
    'team' = any (audiences)
    and exists (
      select 1
      from public.team_members viewer
      inner join public.team_members author on author.team_id = viewer.team_id
      where viewer.user_id = auth.uid()
        and author.user_id = feed_posts.user_id
    )
  );

create policy "feed_posts_insert_own"
  on public.feed_posts for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.activities a
      where a.id = activity_id
        and a.user_id = auth.uid()
    )
  );

create policy "feed_posts_update_own"
  on public.feed_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "feed_posts_delete_own"
  on public.feed_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Activities visible when attached to a feed post the viewer can read.
create policy "activities_select_feed_shared"
  on public.activities for select
  to authenticated
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.activity_id = activities.id
        and (
          fp.user_id = auth.uid()
          or 'community' = any (fp.audiences)
          or (
            'team' = any (fp.audiences)
            and exists (
              select 1
              from public.team_members viewer
              inner join public.team_members author on author.team_id = viewer.team_id
              where viewer.user_id = auth.uid()
                and author.user_id = fp.user_id
            )
          )
        )
    )
  );
