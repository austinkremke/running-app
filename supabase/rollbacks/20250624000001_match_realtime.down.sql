-- Rollback for 20250624000001_match_realtime.sql
-- Apply manually if you need to revert Phase 5 (match chat + Realtime tables):
--   supabase db execute --file supabase/rollbacks/20250624000001_match_realtime.down.sql
--
-- Or via psql against the target database.

-- Remove Realtime publication entries (ignore if already removed).
do $$
begin
  alter publication supabase_realtime drop table public.match_messages;
exception
  when undefined_table then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.matches;
exception
  when undefined_table then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.activities;
exception
  when undefined_table then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.match_participants;
exception
  when undefined_table then null;
  when undefined_object then null;
end $$;

drop policy if exists "match_messages_insert_participant" on public.match_messages;
drop policy if exists "match_messages_select_visible" on public.match_messages;

drop table if exists public.match_messages;
