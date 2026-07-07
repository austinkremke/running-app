-- Milestone 07: update the "3 Day Challenge" copy to reflect the decided
-- top-N contributor scoring rule (no pre-match lineup — see milestones/07-team-play.md).
-- The old copy described picking a lineup; that model was replaced before
-- team matchmaking shipped (07 Phase 3), but this reference row was never updated.

update public.match_types
set
  overview = 'Every teammate can run during the 3-day window — there''s no lineup to set beforehand. Only your team''s top 5 point-earners count toward the final score.',
  scoring_details = 'Points come from your team''s top 5 scorers'' combined distance and pace—the more miles they cover, and the faster they run them, the higher your score.'
where id = 'team_3day';
