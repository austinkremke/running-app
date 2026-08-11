-- Rename the match format cards' titles to match the redesigned matchmaking
-- screens: "Distance Duel" (solo_distance) -> "Solo Match", "3 Day Challenge"
-- (team_3day) -> "Team Match". Same match_type_id/criteria — display copy only.

update public.match_types set display_name = 'Solo Match' where id = 'solo_distance';
update public.match_types set display_name = 'Team Match' where id = 'team_3day';
