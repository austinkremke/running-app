-- Rollback for 20260730000002_content_moderation.sql
-- Apply manually if you need to revert:
--   supabase db execute --file supabase/rollbacks/20260730000002_content_moderation.down.sql

drop trigger if exists content_reports_notify_developer on public.content_reports;
drop function if exists public.notify_content_report();

alter table public.notification_events drop constraint if exists notification_events_category_check;
alter table public.notification_events add constraint notification_events_category_check
  check (category in (
    'likes', 'comments', 'friend_requests', 'friend_challenge',
    'match_found', 'match_reminders', 'match_complete', 'friend_activity'
  ));

drop policy if exists "feed_posts_select_friends" on public.feed_posts;
create policy "feed_posts_select_friends"
  on public.feed_posts for select
  to authenticated
  using (
    'friends' = any (audiences)
    and public.are_friends(auth.uid(), user_id)
  );

drop policy if exists "feed_posts_select_team" on public.feed_posts;
create policy "feed_posts_select_team"
  on public.feed_posts for select
  to authenticated
  using (
    'team' = any (audiences)
    and exists (
      select 1
      from public.team_members viewer
      inner join public.team_members author on author.team_id = viewer.team_id
      where viewer.user_id = auth.uid()
        and author.user_id = feed_posts.user_id
    )
  );

drop policy if exists "feed_posts_select_community" on public.feed_posts;
create policy "feed_posts_select_community"
  on public.feed_posts for select
  to authenticated
  using ('community' = any (audiences));

create or replace function public.can_view_feed_post(p_post_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.feed_posts fp
    where fp.id = p_post_id
      and (
        fp.user_id = auth.uid()
        or 'community' = any (fp.audiences)
        or (
          'friends' = any (fp.audiences)
          and public.are_friends(auth.uid(), fp.user_id)
        )
        or (
          'team' = any (fp.audiences)
          and exists (
            select 1
            from public.team_members viewer
            inner join public.team_members author on author.team_id = viewer.team_id
            where viewer.user_id = auth.uid()
              and author.user_id = fp.user_id
          )
        )
      )
  );
$$;

drop function if exists public.fetch_blocked_user_ids();
drop function if exists public.unblock_user(uuid);
drop function if exists public.block_user(uuid);
drop function if exists public.report_content(text, uuid, uuid, text);
drop function if exists public.is_blocked_either_way(uuid, uuid);

drop table if exists public.blocked_users;
drop table if exists public.content_reports;
