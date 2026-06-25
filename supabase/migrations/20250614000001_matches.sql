-- Run Off Phase D: match shell on server.

create table public.match_types (
  id text primary key,
  display_name text not null,
  kind text not null check (kind in ('team', 'solo')),
  duration_label text not null default '',
  win_condition text not null default '',
  overview text not null default '',
  scoring_details text not null default '',
  sort_order int not null default 0
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  match_type_id text not null references public.match_types (id),
  kind text not null check (kind in ('team', 'solo')),
  status text not null default 'active' check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  home_team_id uuid references public.teams (id) on delete set null,
  away_team_id uuid references public.teams (id) on delete set null,
  state_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  team_id uuid references public.teams (id) on delete set null,
  side text not null check (side in ('home', 'away')),
  points int not null default 0 check (points >= 0),
  lineup_order int,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index match_participants_match_user_idx
  on public.match_participants (match_id, user_id)
  where user_id is not null;

create index matches_status_ends_at_idx on public.matches (status, ends_at desc);
create index matches_home_team_idx on public.matches (home_team_id);
create index matches_away_team_idx on public.matches (away_team_id);
create index match_participants_match_id_idx on public.match_participants (match_id);
create index match_participants_user_id_idx on public.match_participants (user_id);

alter table public.activities
  add constraint activities_match_id_fkey
  foreign key (match_id) references public.matches (id) on delete set null;

alter table public.match_types enable row level security;
alter table public.matches enable row level security;
alter table public.match_participants enable row level security;

create policy "match_types_select_authenticated"
  on public.match_types for select
  to authenticated
  using (true);

create policy "matches_select_participant"
  on public.matches for select
  to authenticated
  using (
    exists (
      select 1
      from public.match_participants mp
      where mp.match_id = matches.id
        and mp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.team_id in (matches.home_team_id, matches.away_team_id)
    )
    or (matches.kind = 'solo' and matches.status = 'active')
  );

create policy "match_participants_select_visible"
  on public.match_participants for select
  to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_participants.match_id
        and (
          exists (
            select 1
            from public.match_participants viewer
            where viewer.match_id = m.id
              and viewer.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.team_members tm
            where tm.user_id = auth.uid()
              and tm.team_id in (m.home_team_id, m.away_team_id)
          )
        )
    )
  );

create policy "match_participants_insert_self"
  on public.match_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create trigger match_participants_set_updated_at
  before update on public.match_participants
  for each row execute function public.set_updated_at();

-- Reference + demo data
insert into public.match_types (id, display_name, kind, duration_label, win_condition, overview, scoring_details, sort_order)
values
  (
    'team_3day',
    '3 Day Challenge',
    'team',
    '3 Days',
    'Highest team score wins',
    'Your lineup has 3 days to earn as many points as possible. Every run from your selected runners counts toward your team total.',
    'Points come from your team''s combined distance and pace—the more miles your lineup covers, and the faster they run them, the higher your score.',
    1
  ),
  (
    'solo_distance',
    'Distance Duel',
    'solo',
    '3 Days',
    'Most distance wins',
    'Head-to-head solo challenge. Highest combined distance over the match window wins.',
    'Distance and pace both contribute to your match score.',
    2
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  kind = excluded.kind,
  duration_label = excluded.duration_label,
  win_condition = excluded.win_condition,
  overview = excluded.overview,
  scoring_details = excluded.scoring_details,
  sort_order = excluded.sort_order;

insert into public.teams (id, name, tag, motto, logo_icon, logo_accent)
values (
  '11111111-1111-4111-8111-222222222222',
  'Pacers',
  'PACS',
  'Pace is power.',
  'footsteps',
  'purple'
)
on conflict (id) do update set
  name = excluded.name,
  tag = excluded.tag,
  motto = excluded.motto,
  logo_icon = excluded.logo_icon,
  logo_accent = excluded.logo_accent;

insert into public.matches (
  id,
  match_type_id,
  kind,
  status,
  started_at,
  ends_at,
  home_team_id,
  away_team_id,
  state_json
)
values (
  '22222222-2222-4222-8222-222222222222',
  'team_3day',
  'team',
  'active',
  now(),
  now() + interval '3 days 14 hours 22 minutes',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-222222222222',
  '{
    "activities": [
      {
        "id": "activity-1",
        "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        "playerName": "Austin",
        "description": "ran 5.2 miles",
        "pointsEarned": 54,
        "timeAgo": "2m ago",
        "accent": "lime"
      },
      {
        "id": "activity-2",
        "avatarUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
        "playerName": "Tyler",
        "description": "completed 4.8 miles",
        "pointsEarned": 48,
        "timeAgo": "10m ago",
        "accent": "lime"
      },
      {
        "id": "activity-3",
        "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        "playerName": "Sarah",
        "description": "ran 3.9 miles",
        "pointsEarned": 41,
        "timeAgo": "18m ago",
        "accent": "purple"
      }
    ],
    "homeMembers": [
      {"name": "Austin", "level": 24, "points": 412, "distanceMiles": 18.6, "pacePerMile": "7:12", "isLeader": true, "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop"},
      {"name": "Tyler", "level": 18, "points": 299, "distanceMiles": 12.4, "pacePerMile": "7:48", "avatarUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop"},
      {"name": "Chris", "level": 15, "points": 246, "distanceMiles": 14.1, "pacePerMile": "8:05", "avatarUrl": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop"}
    ],
    "awayMembers": [
      {"name": "Sarah", "level": 17, "points": 384, "distanceMiles": 15.8, "pacePerMile": "7:34", "isLeader": true, "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"},
      {"name": "Mike", "level": 15, "points": 271, "distanceMiles": 11.2, "pacePerMile": "7:56", "avatarUrl": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop"},
      {"name": "Emma", "level": 14, "points": 236, "distanceMiles": 10.2, "pacePerMile": "8:11", "avatarUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"}
    ],
    "homePoints": 1248,
    "awayPoints": 1181
  }'::jsonb
)
on conflict (id) do update set
  match_type_id = excluded.match_type_id,
  kind = excluded.kind,
  status = excluded.status,
  ends_at = excluded.ends_at,
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  state_json = excluded.state_json;

insert into public.matches (
  id,
  match_type_id,
  kind,
  status,
  started_at,
  ends_at,
  state_json
)
values (
  '33333333-3333-4333-8333-333333333333',
  'solo_distance',
  'solo',
  'active',
  now(),
  now() + interval '2 days 14 hours 32 minutes',
  '{
    "awayRunner": {
      "id": "runner-jordan",
      "name": "Jordan",
      "level": 21,
      "avatarUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      "totalPoints": 398,
      "accent": "purple"
    },
    "info": {
      "rank": 24812,
      "rankPercentile": "Top 12%",
      "matchType": "Distance",
      "matchTypeIcon": "footsteps",
      "entryFee": 100,
      "entryFeeLabel": "Winner Takes All"
    },
    "stats": [],
    "activities": [],
    "highlights": []
  }'::jsonb
)
on conflict (id) do update set
  state_json = excluded.state_json,
  ends_at = excluded.ends_at;
