-- Break RLS recursion between activities and feed_posts (42P17 on insert/select).

create or replace function public.user_owns_activity(p_activity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.activities
    where id = p_activity_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.activity_has_visible_feed_post(p_activity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.feed_posts fp
    where fp.activity_id = p_activity_id
      and (
        fp.user_id = auth.uid()
        or 'community' = any (fp.audiences)
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

drop policy if exists "feed_posts_insert_own" on public.feed_posts;
drop policy if exists "activities_select_feed_shared" on public.activities;

create policy "feed_posts_insert_own"
  on public.feed_posts for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_owns_activity(activity_id)
  );

create policy "activities_select_feed_shared"
  on public.activities for select
  to authenticated
  using (public.activity_has_visible_feed_post(id));
