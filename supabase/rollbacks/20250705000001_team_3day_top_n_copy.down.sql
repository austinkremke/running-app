-- Rollback: restore the original lineup-based "3 Day Challenge" copy.

update public.match_types
set
  overview = 'Your lineup has 3 days to earn as many points as possible. Every run from your selected runners counts toward your team total.',
  scoring_details = 'Points come from your team''s combined distance and pace—the more miles your lineup covers, and the faster they run them, the higher your score.'
where id = 'team_3day';
