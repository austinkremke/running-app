-- Milestone 05 Phase 3: friends graph + friends feed visibility.

create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_user_id),
  check (user_id <> friend_user_id)
);

create index friendships_friend_user_id_idx on public.friendships (friend_user_id);

alter table public.friendships enable row level security;

create policy "friendships_select_own"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.are_friends(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships
    where user_id = p_user_a
      and friend_user_id = p_user_b
  );
$$;

create or replace function public.add_friend(p_friend_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_friend_user_id = v_user_id then
    raise exception 'Cannot friend yourself';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_friend_user_id
  ) then
    raise exception 'User not found';
  end if;

  insert into public.friendships (user_id, friend_user_id)
  values (v_user_id, p_friend_user_id)
  on conflict do nothing;

  insert into public.friendships (user_id, friend_user_id)
  values (p_friend_user_id, v_user_id)
  on conflict do nothing;
end;
$$;

revoke all on function public.add_friend(uuid) from public;
grant execute on function public.add_friend(uuid) to authenticated;

grant execute on function public.are_friends(uuid, uuid) to authenticated;

create policy "feed_posts_select_friends"
  on public.feed_posts for select
  to authenticated
  using (
    'friends' = any (audiences)
    and public.are_friends(auth.uid(), user_id)
  );

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

drop policy if exists "activities_select_feed_shared" on public.activities;

create policy "activities_select_feed_shared"
  on public.activities for select
  to authenticated
  using (
    exists (
      select 1
      from public.feed_posts fp
      where fp.activity_id = activities.id
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
    )
  );

create or replace function public.achievement_metric(
  p_user_id uuid,
  p_criteria_type text,
  p_criteria jsonb
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_count numeric := 0;
  v_miles double precision;
  v_pace_sec double precision;
begin
  case p_criteria_type
    when 'activity_count' then
      select count(*)::numeric into v_count from public.activities where user_id = p_user_id;
      return v_count;

    when 'lifetime_distance_miles' then
      select coalesce(sum(distance_meters), 0) / 1609.344 into v_miles
      from public.activities where user_id = p_user_id;
      return v_miles;

    when 'single_run_distance_miles' then
      select coalesce(max(distance_meters), 0) / 1609.344 into v_miles
      from public.activities where user_id = p_user_id;
      return v_miles;

    when 'single_run_pace_sec_per_mi' then
      select min(
        case
          when distance_meters >= (coalesce((p_criteria->>'min_miles')::double precision, 1) * 1609.344)
            and duration_seconds > 0
          then duration_seconds / (distance_meters / 1609.344)
          else null
        end
      )
      into v_pace_sec
      from public.activities
      where user_id = p_user_id;

      return coalesce(v_pace_sec, 999999);

    when 'streak_days' then
      select coalesce(streak_days, 0)::numeric into v_count
      from public.player_progress where user_id = p_user_id;
      return v_count;

    when 'level_reached' then
      select public.level_from_total_xp(coalesce(total_xp, 0)::bigint)::numeric into v_count
      from public.player_progress where user_id = p_user_id;
      return coalesce(v_count, 1);

    when 'feed_post_count' then
      select count(*)::numeric into v_count from public.feed_posts where user_id = p_user_id;
      return v_count;

    when 'feed_like_given_count' then
      select count(*)::numeric into v_count from public.feed_reactions where user_id = p_user_id;
      return v_count;

    when 'feed_like_received_count' then
      select count(*)::numeric into v_count
      from public.feed_reactions fr
      join public.feed_posts fp on fp.id = fr.post_id
      where fp.user_id = p_user_id;
      return v_count;

    when 'feed_comment_count' then
      select count(*)::numeric into v_count from public.feed_comments where user_id = p_user_id;
      return v_count;

    when 'team_joined' then
      select count(*)::numeric into v_count from public.team_members where user_id = p_user_id;
      return v_count;

    when 'match_enrolled_count' then
      select count(*)::numeric into v_count from public.match_participants where user_id = p_user_id;
      return v_count;

    when 'match_win_count' then
      select coalesce(season_wins, 0)::numeric into v_count
      from public.player_rank where user_id = p_user_id;
      return coalesce(v_count, 0);

    when 'competitive_rating_min' then
      select coalesce(competitive_rating, 0)::numeric into v_count
      from public.player_rank where user_id = p_user_id;
      return coalesce(v_count, 0);

    when 'client_event' then
      select count(*)::numeric into v_count
      from public.achievement_events
      where user_id = p_user_id
        and event_type = coalesce(p_criteria->>'event', '');
      return v_count;

    when 'friend_count' then
      select count(*)::numeric into v_count
      from public.friendships
      where user_id = p_user_id;
      return coalesce(v_count, 0);

    else
      return 0;
  end case;
end;
$$;

update public.achievement_definitions
set is_active = true
where id = 'add_friend';
