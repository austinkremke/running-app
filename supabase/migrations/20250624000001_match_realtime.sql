-- Match chat + Supabase Realtime for live match updates (milestone 05 Phase 5).

create table public.match_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint match_messages_body_length check (
    char_length(trim(body)) > 0
    and char_length(body) <= 500
  )
);

create index match_messages_match_id_created_at_idx
  on public.match_messages (match_id, created_at);

alter table public.match_messages enable row level security;

create policy "match_messages_select_visible"
  on public.match_messages for select
  to authenticated
  using (public.can_view_match(match_id));

create policy "match_messages_insert_participant"
  on public.match_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      public.is_match_participant(match_id, auth.uid())
      or exists (
        select 1
        from public.matches m
        inner join public.team_members tm
          on tm.user_id = auth.uid()
          and tm.team_id in (m.home_team_id, m.away_team_id)
        where m.id = match_id
      )
    )
  );

-- Realtime: live scoreboard + chat delivery.
alter publication supabase_realtime add table public.match_participants;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_messages;
