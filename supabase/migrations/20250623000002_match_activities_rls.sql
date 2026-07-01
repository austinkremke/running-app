-- Allow match participants to read activities linked to their match (solo scoreboard).

create policy "activities_select_match_participant"
  on public.activities for select
  to authenticated
  using (
    match_id is not null
    and public.can_view_match(match_id)
  );
