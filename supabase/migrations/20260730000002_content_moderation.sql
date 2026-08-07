-- App Store Guideline 1.2 (UGC Safety) compliance: report content + block
-- users. `content_reports` is the reporting queue (developer reviews and
-- actions within 24h — a process commitment, not something this schema
-- enforces). `blocked_users` drives instant, bidirectional hiding of a
-- blocked user's content, plumbed through the existing `can_view_feed_post`
-- chokepoint (already redefined twice for audience rules — see
-- 20250618000001_feed_likes_comments.sql, 20250621000001_friends_graph.sql)
-- plus the feed_posts select policies that don't route through it.

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  content_type text not null check (content_type in ('feed_post', 'feed_comment', 'match_message', 'profile')),
  content_id uuid not null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reason text,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.content_reports enable row level security;

create policy "content_reports_insert_own"
  on public.content_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "content_reports_select_own"
  on public.content_reports for select
  to authenticated
  using (reporter_id = auth.uid());

create table public.blocked_users (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "blocked_users_select_own"
  on public.blocked_users for select
  to authenticated
  using (blocker_id = auth.uid());

create policy "blocked_users_insert_own"
  on public.blocked_users for insert
  to authenticated
  with check (blocker_id = auth.uid());

create policy "blocked_users_delete_own"
  on public.blocked_users for delete
  to authenticated
  using (blocker_id = auth.uid());

create or replace function public.is_blocked_either_way(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_users
    where (blocker_id = p_user_a and blocked_id = p_user_b)
       or (blocker_id = p_user_b and blocked_id = p_user_a)
  );
$$;

create or replace function public.report_content(
  p_content_type text,
  p_content_id uuid,
  p_reported_user_id uuid default null,
  p_reason text default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  insert into public.content_reports (reporter_id, content_type, content_id, reported_user_id, reason)
  values (auth.uid(), p_content_type, p_content_id, p_reported_user_id, p_reason)
  returning id;
$$;

revoke all on function public.report_content(text, uuid, uuid, text) from public;
grant execute on function public.report_content(text, uuid, uuid, text) to authenticated;

create or replace function public.block_user(p_blocked_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.blocked_users (blocker_id, blocked_id)
  values (auth.uid(), p_blocked_id)
  on conflict do nothing;
$$;

revoke all on function public.block_user(uuid) from public;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.blocked_users
  where blocker_id = auth.uid() and blocked_id = p_blocked_id;
$$;

revoke all on function public.unblock_user(uuid) from public;
grant execute on function public.unblock_user(uuid) to authenticated;

create or replace function public.fetch_blocked_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select blocked_id from public.blocked_users where blocker_id = auth.uid();
$$;

revoke all on function public.fetch_blocked_user_ids() from public;
grant execute on function public.fetch_blocked_user_ids() to authenticated;

-- Third redefinition of can_view_feed_post (prior: 20250618000001, then
-- 20250621000001 added the friends-audience clause) — adds the block check
-- once here, covering every feed_reactions/feed_comments/activities policy
-- that already delegates to it.
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
      and not public.is_blocked_either_way(auth.uid(), fp.user_id)
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

-- feed_posts itself has separate per-audience select policies (not routed
-- through can_view_feed_post) — block-filter the ones that show other
-- users' posts. "_own" is untouched (you can't block yourself; seeing your
-- own posts is unaffected). Match-result posts (_team_match/_solo_match)
-- are out of scope here — they're structured match records, not the
-- free-text UGC surface Apple's review is about.
drop policy if exists "feed_posts_select_community" on public.feed_posts;
create policy "feed_posts_select_community"
  on public.feed_posts for select
  to authenticated
  using (
    'community' = any (audiences)
    and not public.is_blocked_either_way(auth.uid(), user_id)
  );

drop policy if exists "feed_posts_select_team" on public.feed_posts;
create policy "feed_posts_select_team"
  on public.feed_posts for select
  to authenticated
  using (
    'team' = any (audiences)
    and not public.is_blocked_either_way(auth.uid(), user_id)
    and exists (
      select 1
      from public.team_members viewer
      inner join public.team_members author on author.team_id = viewer.team_id
      where viewer.user_id = auth.uid()
        and author.user_id = feed_posts.user_id
    )
  );

drop policy if exists "feed_posts_select_friends" on public.feed_posts;
create policy "feed_posts_select_friends"
  on public.feed_posts for select
  to authenticated
  using (
    'friends' = any (audiences)
    and not public.is_blocked_either_way(auth.uid(), user_id)
    and public.are_friends(auth.uid(), user_id)
  );

-- Notify the developer (push, via the existing notification_events /
-- deliver-notifications pipeline — no new third-party service) when a
-- report comes in, so the 24h response commitment is actionable. Reports
-- remain fully queryable in Supabase Studio regardless as the source of
-- truth.
alter table public.notification_events drop constraint if exists notification_events_category_check;
alter table public.notification_events add constraint notification_events_category_check
  check (category in (
    'likes', 'comments', 'friend_requests', 'friend_challenge',
    'match_found', 'match_reminders', 'match_complete', 'friend_activity',
    'content_report'
  ));

create or replace function public.notify_content_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_developer_id uuid;
begin
  select id into v_developer_id from auth.users where email = 'atkremke@gmail.com' limit 1;

  if v_developer_id is not null then
    insert into public.notification_events (user_id, category, title, body, data)
    values (
      v_developer_id,
      'content_report',
      'New content report',
      coalesce(new.reason, new.content_type || ' reported'),
      jsonb_build_object(
        'report_id', new.id,
        'content_type', new.content_type,
        'content_id', new.content_id,
        'reported_user_id', new.reported_user_id
      )
    );
  end if;

  return new;
end;
$$;

create trigger content_reports_notify_developer
  after insert on public.content_reports
  for each row
  execute function public.notify_content_report();
