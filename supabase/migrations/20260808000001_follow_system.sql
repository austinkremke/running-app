-- Friend requests -> instant one-directional follows.
--
-- `friendships` was already a directed edge table (user_id -> friend_user_id);
-- the only thing making it feel like mutual "friendship" was `add_friend()`
-- inserting both directions after a request/accept handshake. This migration
-- removes that handshake entirely: following someone is now a single
-- unilateral action, like Twitter/Instagram, with no approval step. A 1v1
-- challenge only requires the challenger to follow the challenged player
-- (not mutual) — `are_friends()` was already a single-direction check, so no
-- change was needed there beyond the error copy.

alter table public.friendships rename to follows;
alter table public.follows rename column user_id to follower_id;
alter table public.follows rename column friend_user_id to followed_id;

drop policy if exists "friendships_select_own" on public.follows;

-- Follower/following lists and counts are public, like team rosters and
-- leaderboards elsewhere in this app.
create policy "follows_select_all"
  on public.follows for select
  to authenticated
  using (true);

-- Name kept for compatibility with every existing caller (RLS policies,
-- send_solo_match_challenge, achievement_metric) — despite the name, this now
-- checks a one-directional follow edge, not mutual friendship.
create or replace function public.are_friends(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.follows
    where follower_id = p_user_a
      and followed_id = p_user_b
  );
$$;

-- Instant, one-directional follow — no request/approval step.
create or replace function public.follow_user(p_followed_id uuid)
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

  if p_followed_id = v_user_id then
    raise exception 'Cannot follow yourself';
  end if;

  if not exists (select 1 from public.profiles where id = p_followed_id) then
    raise exception 'User not found';
  end if;

  insert into public.follows (follower_id, followed_id)
  values (v_user_id, p_followed_id)
  on conflict do nothing;
end;
$$;

create or replace function public.unfollow_user(p_followed_id uuid)
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

  delete from public.follows
  where follower_id = v_user_id
    and followed_id = p_followed_id;
end;
$$;

revoke all on function public.follow_user(uuid) from public;
revoke all on function public.unfollow_user(uuid) from public;
grant execute on function public.follow_user(uuid) to authenticated;
grant execute on function public.unfollow_user(uuid) to authenticated;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- Superseded by follow_user/unfollow_user (no more bidirectional insert/delete).
drop function if exists public.add_friend(uuid);
drop function if exists public.remove_friend(uuid);

-- "must be mutual friends" -> "must follow them" (any-direction follow is
-- enough per product decision; the underlying check was already
-- single-directional, only the error copy changes).
create or replace function public.send_solo_match_challenge(
  p_challenged_user_id uuid,
  p_match_type_id text default 'solo_distance'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.solo_match_challenges%rowtype;
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_challenged_user_id is null then
    raise exception 'A runner to challenge is required';
  end if;

  if v_user_id = p_challenged_user_id then
    raise exception 'Cannot challenge yourself';
  end if;

  if not public.are_friends(v_user_id, p_challenged_user_id) then
    raise exception 'You can only challenge people you follow';
  end if;

  perform public.expire_stale_solo_match_challenges();
  perform public.finalize_due_solo_matches_for_user(v_user_id);
  perform public.finalize_due_solo_matches_for_user(p_challenged_user_id);

  if public.user_has_live_active_solo_match(v_user_id) then
    raise exception 'Finish your current match before sending a challenge';
  end if;

  if public.user_has_live_active_solo_match(p_challenged_user_id) then
    raise exception 'That runner is already in a match';
  end if;

  if public.user_is_waiting_in_solo_queue(v_user_id) then
    raise exception 'Cancel matchmaking before sending a challenge';
  end if;

  if public.user_is_waiting_in_solo_queue(p_challenged_user_id) then
    raise exception 'That runner is currently searching for a match';
  end if;

  if exists (
    select 1
    from public.solo_match_challenges
    where status = 'pending'
      and (
        (challenger_id = v_user_id and challenged_id = p_challenged_user_id)
        or (challenger_id = p_challenged_user_id and challenged_id = v_user_id)
      )
  ) then
    raise exception 'A challenge is already pending with this runner';
  end if;

  insert into public.solo_match_challenges (
    challenger_id,
    challenged_id,
    match_type_id
  )
  values (
    v_user_id,
    p_challenged_user_id,
    coalesce(p_match_type_id, 'solo_distance')
  )
  returning * into v_challenge;

  select *
    into v_profile
    from public.profiles
    where id = p_challenged_user_id;

  return jsonb_build_object(
    'challenge_id', v_challenge.id,
    'created_at', v_challenge.created_at,
    'challenged_user_id', p_challenged_user_id,
    'challenged_name', coalesce(v_profile.display_name, 'Runner'),
    'challenged_avatar_url', v_profile.avatar_url
  );
end;
$$;

-- friend_count achievement metric now counts follows the user initiated
-- (unchanged id/criteria_type — only its data source moves to `follows`).
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
      from public.follows
      where follower_id = p_user_id;
      return coalesce(v_count, 0);

    else
      return 0;
  end case;
end;
$$;

-- Notify a user's FOLLOWERS (not who they follow) when they post to the
-- "friends"-audience feed — the old bidirectional data made this
-- direction-agnostic; now that `follows` is truly directional, this must
-- explicitly select the reverse edge (people who follow the author).
create or replace function public.enqueue_friend_activity_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_name text;
  v_distance_miles numeric;
  v_follower record;
begin
  if not ('friends' = any(new.audiences)) then
    return new;
  end if;

  select display_name into v_author_name from public.profiles where id = new.user_id;

  select round((a.distance_meters / 1609.344)::numeric, 1)
    into v_distance_miles
    from public.activities a
    where a.id = new.activity_id;

  for v_follower in
    select follower_id as user_id from public.follows where followed_id = new.user_id
  loop
    insert into public.notification_events (user_id, category, title, body, data)
    values (
      v_follower.user_id,
      'friend_activity',
      coalesce(v_author_name, 'Someone you follow') || ' completed a run',
      coalesce(v_author_name, 'Someone you follow') || ' ran ' || coalesce(v_distance_miles::text, '0') || ' mi.',
      jsonb_build_object('post_id', new.id, 'author_id', new.user_id)
    );
  end loop;

  return new;
end;
$$;

-- New-follower push notification, replacing the friend-request pipeline
-- dropped below.
create or replace function public.enqueue_new_follower_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_follower_name text;
begin
  select display_name into v_follower_name from public.profiles where id = new.follower_id;

  insert into public.notification_events (user_id, category, title, body, data)
  values (
    new.followed_id,
    'new_follower',
    coalesce(v_follower_name, 'Someone') || ' started following you',
    coalesce(v_follower_name, 'Someone') || ' is now following your runs.',
    jsonb_build_object('follower_id', new.follower_id)
  );
  return new;
end;
$$;

create trigger follows_enqueue_new_follower_notification
  after insert on public.follows
  for each row execute function public.enqueue_new_follower_notification();

-- notification_events.category + notification_preferences: swap
-- 'friend_requests' for 'new_follower'. Drop the old constraint before
-- rewriting existing rows (it doesn't allow 'new_follower' yet), then add
-- the new one back.
alter table public.notification_events drop constraint notification_events_category_check;

update public.notification_events
set category = 'new_follower'
where category = 'friend_requests';

alter table public.notification_events add constraint notification_events_category_check
  check (category in (
    'likes', 'comments', 'new_follower', 'friend_challenge',
    'match_found', 'match_reminders', 'match_complete', 'friend_activity',
    'content_report'
  ));

alter table public.notification_preferences rename column friend_requests to new_follower;

create or replace function public.update_notification_preference(p_category text, p_enabled boolean)
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

  if p_category not in (
    'likes', 'comments', 'new_follower', 'friend_challenge',
    'match_found', 'match_reminders', 'match_complete', 'friend_activity'
  ) then
    raise exception 'Invalid category';
  end if;

  execute format(
    'update public.notification_preferences set %I = $1, updated_at = now() where user_id = $2',
    p_category
  ) using p_enabled, v_user_id;
end;
$$;

drop trigger if exists friend_requests_enqueue_notification on public.friend_requests;
drop function if exists public.enqueue_friend_request_notification();

-- Achievement id/criteria_type unchanged (avoids touching historical unlock
-- records) — just the display copy, since "Add a Friend" no longer matches
-- the follow-based action that earns it.
update public.achievement_definitions
set display_name = 'Follow Someone',
    description = 'Follow your first runner.'
where id = 'add_friend';

-- The whole request/approval flow is gone — following is instant now.
drop function if exists public.send_friend_request(uuid);
drop function if exists public.respond_to_friend_request(uuid, boolean);
drop function if exists public.cancel_friend_request(uuid);
drop function if exists public.get_friend_notifications();
drop function if exists public.has_friend_notifications();
drop table if exists public.friend_requests;
