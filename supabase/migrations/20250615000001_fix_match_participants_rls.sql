-- Fix infinite recursion in match_participants RLS (policy queried same table).

drop policy if exists "matches_select_participant" on public.matches;
drop policy if exists "match_participants_select_visible" on public.match_participants;

create or replace function public.is_match_participant(p_match_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.match_participants
    where match_id = p_match_id
      and user_id = p_user_id
  );
$$;

create or replace function public.can_view_match(p_match_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_match_participant(p_match_id)
  or exists (
    select 1
    from public.matches m
    inner join public.team_members tm
      on tm.user_id = auth.uid()
      and tm.team_id in (m.home_team_id, m.away_team_id)
    where m.id = p_match_id
  )
  or exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and m.kind = 'solo'
      and m.status = 'active'
  );
$$;

create policy "matches_select_participant"
  on public.matches for select
  to authenticated
  using (public.can_view_match(id));

create policy "match_participants_select_visible"
  on public.match_participants for select
  to authenticated
  using (public.can_view_match(match_id));
