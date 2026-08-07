-- Rollback for 20260730000001_terms_acceptance.sql
-- Apply manually if you need to revert:
--   supabase db execute --file supabase/rollbacks/20260730000001_terms_acceptance.down.sql

drop function if exists public.accept_terms();

alter table public.profiles
  drop column if exists terms_accepted_at;
