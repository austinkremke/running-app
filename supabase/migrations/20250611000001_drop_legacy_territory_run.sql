-- Remove Territory Run tables from the reused Supabase project (Run Off).
-- Safe to run on a fresh or partially migrated database.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

drop table if exists public.territory_cells cascade;
drop table if exists public.run_points cascade;
drop table if exists public.runs cascade;
drop table if exists public.users cascade;

drop table if exists public.xp_ledger cascade;
drop table if exists public.player_rank cascade;
drop table if exists public.player_progress cascade;
drop table if exists public.profiles cascade;
drop table if exists public.rank_tiers cascade;
