-- Rollback for 20250624000002_repair_solo_match_credits.sql
-- Data repair is not automatically reversible; this only drops the helper function.

drop function if exists public.repair_solo_match_activity_credits();
