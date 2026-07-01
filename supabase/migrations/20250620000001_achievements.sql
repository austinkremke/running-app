-- Milestone 06 Phase 2: achievements catalog, unlocks, and evaluators.

create table public.achievement_definitions (
  id text primary key,
  display_name text not null,
  description text not null default '',
  category text not null,
  sort_order int not null default 0,
  tier text not null default 'bronze'
    check (tier in ('bronze', 'silver', 'gold', 'elite')),
  icon text not null default 'trophy-outline',
  xp_reward int not null default 0 check (xp_reward >= 0),
  criteria_type text not null,
  criteria_json jsonb not null default '{}'::jsonb,
  is_hidden boolean not null default false,
  is_active boolean not null default true,
  requires_achievement_id text references public.achievement_definitions (id)
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null references public.achievement_definitions (id),
  unlocked_at timestamptz not null default now(),
  progress_snapshot_json jsonb,
  primary key (user_id, achievement_id)
);

create table public.achievement_events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  metadata_json jsonb,
  primary key (user_id, event_type)
);

create index user_achievements_user_unlocked_idx
  on public.user_achievements (user_id, unlocked_at desc);

alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.achievement_events enable row level security;

create policy "achievement_definitions_select_authenticated"
  on public.achievement_definitions for select
  to authenticated
  using (true);

create policy "user_achievements_select_self"
  on public.user_achievements for select
  to authenticated
  using (auth.uid() = user_id);

create policy "achievement_events_select_self"
  on public.achievement_events for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.xp_for_level_up(p_level int)
returns int
language sql
immutable
as $$
  select greatest(1, round(120 * power(1.09, p_level))::int);
$$;

create or replace function public.cumulative_xp_for_level(p_level int)
returns bigint
language plpgsql
immutable
as $$
declare
  v_total bigint := 0;
  v_current int := 1;
begin
  while v_current < p_level loop
    v_total := v_total + public.xp_for_level_up(v_current);
    v_current := v_current + 1;
  end loop;
  return v_total;
end;
$$;

create or replace function public.level_from_total_xp(p_total_xp bigint)
returns int
language plpgsql
immutable
as $$
declare
  v_level int := 1;
begin
  while v_level < 98 loop
    if p_total_xp < public.cumulative_xp_for_level(v_level + 1) then
      return v_level;
    end if;
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

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
      return 0;

    else
      return 0;
  end case;
end;
$$;

create or replace function public.user_meets_achievement(
  p_user_id uuid,
  p_definition public.achievement_definitions
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_metric numeric;
  v_threshold numeric;
begin
  if not p_definition.is_active then
    return false;
  end if;

  v_metric := public.achievement_metric(p_user_id, p_definition.criteria_type, p_definition.criteria_json);

  case p_definition.criteria_type
    when 'single_run_pace_sec_per_mi' then
      v_threshold := coalesce((p_definition.criteria_json->>'max_pace_sec')::numeric, 999999);
      return v_metric <= v_threshold;
    when 'client_event', 'team_joined' then
      v_threshold := 1;
      return v_metric >= v_threshold;
    else
      v_threshold := coalesce(
        (p_definition.criteria_json->>'count')::numeric,
        (p_definition.criteria_json->>'miles')::numeric,
        (p_definition.criteria_json->>'days')::numeric,
        (p_definition.criteria_json->>'level')::numeric,
        (p_definition.criteria_json->>'wins')::numeric,
        (p_definition.criteria_json->>'rating')::numeric,
        1
      );
      return v_metric >= v_threshold;
  end case;
end;
$$;

create or replace function public.grant_achievement(
  p_user_id uuid,
  p_achievement_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_definition public.achievement_definitions%rowtype;
  v_snapshot jsonb;
begin
  select * into v_definition
  from public.achievement_definitions
  where id = p_achievement_id;

  if not found or not v_definition.is_active then
    return null;
  end if;

  if exists (
    select 1 from public.user_achievements
    where user_id = p_user_id and achievement_id = p_achievement_id
  ) then
    return null;
  end if;

  v_snapshot := jsonb_build_object(
    'criteria_type', v_definition.criteria_type,
    'metric', public.achievement_metric(p_user_id, v_definition.criteria_type, v_definition.criteria_json)
  );

  insert into public.user_achievements (user_id, achievement_id, progress_snapshot_json)
  values (p_user_id, p_achievement_id, v_snapshot);

  if v_definition.xp_reward > 0 then
    update public.player_progress
      set total_xp = total_xp + v_definition.xp_reward
      where user_id = p_user_id;

    insert into public.xp_ledger (
      user_id,
      amount,
      source,
      source_id,
      breakdown_json
    )
    values (
      p_user_id,
      v_definition.xp_reward,
      'achievement',
      p_achievement_id,
      jsonb_build_array(
        jsonb_build_object(
          'label', v_definition.display_name,
          'xp', v_definition.xp_reward
        )
      )
    );
  end if;

  return jsonb_build_object(
    'id', v_definition.id,
    'display_name', v_definition.display_name,
    'description', v_definition.description,
    'category', v_definition.category,
    'tier', v_definition.tier,
    'icon', v_definition.icon,
    'xp_reward', v_definition.xp_reward,
    'unlocked_at', now()
  );
end;
$$;

create or replace function public.evaluate_achievements(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_definition public.achievement_definitions%rowtype;
  v_unlock jsonb;
  v_unlocked jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id <> auth.uid() then
    raise exception 'Cannot evaluate achievements for another user';
  end if;

  for v_definition in
    select *
    from public.achievement_definitions
    where is_active = true
    order by sort_order, id
  loop
    if public.user_meets_achievement(p_user_id, v_definition) then
      v_unlock := public.grant_achievement(p_user_id, v_definition.id);
      if v_unlock is not null then
        v_unlocked := v_unlocked || jsonb_build_array(v_unlock);
      end if;
    end if;
  end loop;

  return v_unlocked;
end;
$$;

create or replace function public.record_achievement_event(
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
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

  insert into public.achievement_events (user_id, event_type, metadata_json)
  values (v_user_id, p_event_type, coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, event_type) do nothing;

  return public.evaluate_achievements(v_user_id);
end;
$$;

revoke all on function public.evaluate_achievements(uuid) from public;
grant execute on function public.evaluate_achievements(uuid) to authenticated;

revoke all on function public.record_achievement_event(text, jsonb) from public;
grant execute on function public.record_achievement_event(text, jsonb) to authenticated;

insert into public.achievement_definitions
  (id, display_name, description, category, sort_order, tier, icon, xp_reward, criteria_type, criteria_json, is_active)
values
  ('first_run', 'First Run', 'Complete your first synced run.', 'distance', 1, 'bronze', 'footsteps', 100, 'activity_count', '{"count": 1}', true),
  ('first_feed_post', 'On the Feed', 'Share a run on the activity feed.', 'distance', 2, 'bronze', 'megaphone-outline', 100, 'feed_post_count', '{"count": 1}', true),
  ('five_miles', '5 Miles', 'Run 5 lifetime miles.', 'distance', 3, 'bronze', 'footsteps', 150, 'lifetime_distance_miles', '{"miles": 5}', true),
  ('fifty_miles', '50 Miles', 'Run 50 lifetime miles.', 'distance', 4, 'silver', 'footsteps', 250, 'lifetime_distance_miles', '{"miles": 50}', true),
  ('hundred_miles', '100 Miles', 'Run 100 lifetime miles.', 'distance', 5, 'gold', 'footsteps', 500, 'lifetime_distance_miles', '{"miles": 100}', true),
  ('week_streak', '7-Day Streak', 'Run 7 days in a row.', 'consistency', 10, 'bronze', 'flame', 250, 'streak_days', '{"days": 7}', true),
  ('month_streak', '30-Day Streak', 'Run 30 days in a row.', 'consistency', 11, 'gold', 'flame', 500, 'streak_days', '{"days": 30}', true),
  ('ten_runs', '10 Runs', 'Complete 10 runs.', 'consistency', 12, 'bronze', 'footsteps-outline', 150, 'activity_count', '{"count": 10}', true),
  ('fifty_runs', '50 Runs', 'Complete 50 runs.', 'consistency', 13, 'silver', 'footsteps-outline', 350, 'activity_count', '{"count": 50}', true),
  ('hundred_runs', '100 Runs', 'Complete 100 runs.', 'consistency', 14, 'gold', 'footsteps-outline', 750, 'activity_count', '{"count": 100}', true),
  ('five_k', '5K', 'Run 3.1 miles in a single run.', 'performance', 20, 'bronze', 'flag-outline', 200, 'single_run_distance_miles', '{"miles": 3.1}', true),
  ('ten_miler', '10 Miler', 'Run 10 miles in a single run.', 'performance', 21, 'silver', 'flag-outline', 350, 'single_run_distance_miles', '{"miles": 10}', true),
  ('half_marathon', 'Half Marathon', 'Run 13.1 miles in a single run.', 'performance', 22, 'silver', 'medal-outline', 500, 'single_run_distance_miles', '{"miles": 13.1}', true),
  ('marathon', 'Marathon', 'Run 26.2 miles in a single run.', 'performance', 23, 'gold', 'medal-outline', 1000, 'single_run_distance_miles', '{"miles": 26.2}', true),
  ('sub_eight', 'Sub 8', 'Average 8:00/mi or faster on a 1+ mile run.', 'performance', 24, 'gold', 'speedometer-outline', 400, 'single_run_pace_sec_per_mi', '{"max_pace_sec": 480, "min_miles": 1}', true),
  ('sub_seven', 'Sub 7', 'Average 7:00/mi or faster on a 1+ mile run.', 'performance', 25, 'elite', 'speedometer-outline', 600, 'single_run_pace_sec_per_mi', '{"max_pace_sec": 420, "min_miles": 1}', true),
  ('first_like', 'High Five', 'Like another runner''s post.', 'social', 30, 'bronze', 'heart-outline', 50, 'feed_like_given_count', '{"count": 1}', true),
  ('first_comment', 'Say Something', 'Leave a comment on a post.', 'social', 31, 'bronze', 'chatbubble-outline', 75, 'feed_comment_count', '{"count": 1}', true),
  ('ten_likes_received', 'Crowd Favorite', 'Receive 10 likes on your posts.', 'social', 32, 'silver', 'heart', 200, 'feed_like_received_count', '{"count": 10}', true),
  ('share_post', 'Share the W', 'Share a feed post externally.', 'social', 33, 'bronze', 'share-outline', 75, 'client_event', '{"event": "share_feed_post"}', true),
  ('rate_app', 'Rate Run Off', 'Rate the app.', 'community', 40, 'bronze', 'star-outline', 75, 'client_event', '{"event": "rate_app"}', true),
  ('notifications_on', 'Stay in the Loop', 'Enable push notifications.', 'community', 41, 'bronze', 'notifications-outline', 75, 'client_event', '{"event": "notifications_on"}', true),
  ('follow_instagram', 'Follow on Instagram', 'Follow Run Off on Instagram.', 'community', 42, 'bronze', 'logo-instagram', 75, 'client_event', '{"event": "follow_instagram"}', true),
  ('follow_tiktok', 'Follow on TikTok', 'Follow Run Off on TikTok.', 'community', 43, 'bronze', 'logo-tiktok', 75, 'client_event', '{"event": "follow_tiktok"}', true),
  ('add_friend', 'Add a Friend', 'Add your first friend.', 'community', 44, 'silver', 'person-add-outline', 100, 'friend_count', '{"count": 1}', false),
  ('join_team', 'Join the Crew', 'Join a team.', 'team', 50, 'bronze', 'people-outline', 150, 'team_joined', '{}', true),
  ('first_match', 'Throw Down', 'Enter your first match.', 'competitive', 51, 'bronze', 'flash-outline', 200, 'match_enrolled_count', '{"count": 1}', true),
  ('first_win', 'First Blood', 'Win your first match.', 'competitive', 52, 'silver', 'trophy-outline', 500, 'match_win_count', '{"wins": 1}', false),
  ('ten_wins', 'Ten Wins', 'Win 10 matches.', 'competitive', 53, 'gold', 'trophy', 1000, 'match_win_count', '{"wins": 10}', false),
  ('silver_rank', 'Silver', 'Reach Silver rank (1200 rating).', 'competitive', 54, 'silver', 'ribbon-outline', 500, 'competitive_rating_min', '{"rating": 1200}', true),
  ('gold_rank', 'Gold', 'Reach Gold rank (1400 rating).', 'competitive', 55, 'gold', 'star', 750, 'competitive_rating_min', '{"rating": 1400}', true),
  ('five_hundred_miles', '500 Miles', 'Run 500 lifetime miles.', 'longterm', 60, 'elite', 'footsteps', 1500, 'lifetime_distance_miles', '{"miles": 500}', true),
  ('thousand_miles', '1,000 Miles', 'Run 1,000 lifetime miles.', 'longterm', 61, 'elite', 'footsteps', 2500, 'lifetime_distance_miles', '{"miles": 1000}', true),
  ('level_twenty_five', 'Level 25', 'Reach level 25.', 'longterm', 62, 'gold', 'trending-up-outline', 1000, 'level_reached', '{"level": 25}', true),
  ('level_fifty', 'Level 50', 'Reach level 50.', 'longterm', 63, 'elite', 'trending-up-outline', 2000, 'level_reached', '{"level": 50}', true)
on conflict (id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  category = excluded.category,
  sort_order = excluded.sort_order,
  tier = excluded.tier,
  icon = excluded.icon,
  xp_reward = excluded.xp_reward,
  criteria_type = excluded.criteria_type,
  criteria_json = excluded.criteria_json,
  is_active = excluded.is_active;
