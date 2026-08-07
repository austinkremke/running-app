-- Rollback for 20260730000003_content_filter.sql
-- Apply manually if you need to revert:
--   supabase db execute --file supabase/rollbacks/20260730000003_content_filter.down.sql

drop trigger if exists match_messages_content_filter on public.match_messages;
drop function if exists public.enforce_match_messages_content_filter();

drop trigger if exists feed_comments_content_filter on public.feed_comments;
drop function if exists public.enforce_feed_comments_content_filter();

drop trigger if exists feed_posts_content_filter on public.feed_posts;
drop function if exists public.enforce_feed_posts_content_filter();

drop function if exists public.contains_blocked_terms(text);

drop table if exists public.blocked_terms;
