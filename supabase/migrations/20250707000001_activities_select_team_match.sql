-- Allow viewing teammates'/opponents' activities while an active team match is
-- running, so the team match scoreboard/roster/activity feed can show real
-- synced runs from both sides. RLS policies are OR'd (permissive), so this
-- adds to (not replaces) the existing "select own" policy.

create policy "activities_select_team_match_participants"
  on public.activities for select
  to authenticated
  using (
    exists (
      select 1
      from public.team_members viewer_tm
      join public.matches m
        on m.kind = 'team'
        and m.status = 'active'
        and viewer_tm.team_id in (m.home_team_id, m.away_team_id)
      join public.team_members activity_tm
        on activity_tm.user_id = activities.user_id
        and activity_tm.team_id in (m.home_team_id, m.away_team_id)
      where viewer_tm.user_id = auth.uid()
    )
  );
