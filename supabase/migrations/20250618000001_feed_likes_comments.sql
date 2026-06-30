-- Milestone 05 Phase 1: feed likes (reactions) and comments.

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

create table public.feed_reactions (
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction text not null default 'like' check (reaction = 'like'),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index feed_reactions_post_id_idx on public.feed_reactions (post_id);

create table public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index feed_comments_post_created_idx
  on public.feed_comments (post_id, created_at asc);

alter table public.feed_reactions enable row level security;
alter table public.feed_comments enable row level security;

create policy "feed_reactions_select_visible"
  on public.feed_reactions for select
  to authenticated
  using (public.can_view_feed_post(post_id));

create policy "feed_reactions_insert_own"
  on public.feed_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_view_feed_post(post_id)
  );

create policy "feed_reactions_delete_own"
  on public.feed_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "feed_comments_select_visible"
  on public.feed_comments for select
  to authenticated
  using (public.can_view_feed_post(post_id));

create policy "feed_comments_insert_own"
  on public.feed_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_view_feed_post(post_id)
  );

create policy "feed_comments_delete_own"
  on public.feed_comments for delete
  to authenticated
  using (auth.uid() = user_id);

grant execute on function public.can_view_feed_post(uuid) to authenticated;
