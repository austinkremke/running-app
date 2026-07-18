-- Push notifications, Phase 2: wires the remaining event sources into the
-- notification_events outbox built in Phase 1. Each trigger mirrors the
-- exact reuse convention already used elsewhere (e.g. match_complete reads
-- the same state_json->'completions' payload the get_my_*_match_completions
-- RPCs already read) so there's a single source of truth per event.

-- Likes: feed_reactions insert -> post author (skip self-like).
create or replace function public.enqueue_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author uuid;
  v_liker_name text;
begin
  select user_id into v_post_author from public.feed_posts where id = new.post_id;

  if v_post_author is null or v_post_author = new.user_id then
    return new;
  end if;

  select display_name into v_liker_name from public.profiles where id = new.user_id;

  insert into public.notification_events (user_id, category, title, body, data)
  values (
    v_post_author,
    'likes',
    'New like',
    coalesce(v_liker_name, 'Someone') || ' liked your run.',
    jsonb_build_object('post_id', new.post_id, 'liker_id', new.user_id)
  );

  return new;
end;
$$;

create trigger feed_reactions_enqueue_notification
  after insert on public.feed_reactions
  for each row execute function public.enqueue_like_notification();

-- Comments: feed_comments insert -> post author (skip self-comment).
create or replace function public.enqueue_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author uuid;
  v_commenter_name text;
begin
  select user_id into v_post_author from public.feed_posts where id = new.post_id;

  if v_post_author is null or v_post_author = new.user_id then
    return new;
  end if;

  select display_name into v_commenter_name from public.profiles where id = new.user_id;

  insert into public.notification_events (user_id, category, title, body, data)
  values (
    v_post_author,
    'comments',
    'New comment',
    coalesce(v_commenter_name, 'Someone') || ' commented on your run.',
    jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'commenter_id', new.user_id)
  );

  return new;
end;
$$;

create trigger feed_comments_enqueue_notification
  after insert on public.feed_comments
  for each row execute function public.enqueue_comment_notification();

-- Friend challenge: solo_match_challenges insert -> challenged user.
create or replace function public.enqueue_friend_challenge_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenger_name text;
begin
  select display_name into v_challenger_name from public.profiles where id = new.challenger_id;

  insert into public.notification_events (user_id, category, title, body, data)
  values (
    new.challenged_id,
    'friend_challenge',
    'New challenge',
    coalesce(v_challenger_name, 'A friend') || ' challenged you to a Run Off.',
    jsonb_build_object('challenge_id', new.id, 'challenger_id', new.challenger_id)
  );

  return new;
end;
$$;

create trigger solo_match_challenges_enqueue_notification
  after insert on public.solo_match_challenges
  for each row execute function public.enqueue_friend_challenge_notification();

-- Match found: fires once per match_participants row, which covers solo
-- matchmaking, solo friend-challenge acceptance, and team matchmaking
-- uniformly (team inserts one participant row per team member).
create or replace function public.enqueue_match_found_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
begin
  if new.user_id is null then
    return new;
  end if;

  select * into v_match from public.matches where id = new.match_id;

  if v_match.id is null or v_match.status <> 'active' then
    return new;
  end if;

  insert into public.notification_events (user_id, category, title, body, data)
  values (
    new.user_id,
    'match_found',
    'Match found!',
    case
      when v_match.kind = 'team' then 'Your team match is on. Good luck out there.'
      else 'Your 1v1 match is on. Good luck out there.'
    end,
    jsonb_build_object('match_id', v_match.id, 'kind', v_match.kind)
  );

  return new;
end;
$$;

create trigger match_participants_enqueue_found_notification
  after insert on public.match_participants
  for each row execute function public.enqueue_match_found_notification();

-- Match complete: fires when a match transitions to 'completed'. Reads the
-- same state_json->'completions' payload get_my_solo_match_completions /
-- get_my_team_match_completions already serve to the client — solo entries
-- are keyed by user_id, team entries by team_id (fanned out to members).
create or replace function public.enqueue_match_complete_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_completion jsonb;
  v_outcome text;
  v_title text;
  v_body text;
  v_member record;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  for v_key, v_completion in
    select * from jsonb_each(coalesce(new.state_json -> 'completions', '{}'::jsonb))
  loop
    v_outcome := v_completion ->> 'outcome';
    v_title := case
      when v_outcome = 'win' then 'You won!'
      when v_outcome = 'loss' then 'Match complete'
      else 'Match complete'
    end;
    v_body := case
      when v_outcome = 'win' then 'You beat ' || coalesce(v_completion ->> 'opponent_name', 'your opponent') || '.'
      when v_outcome = 'loss' then coalesce(v_completion ->> 'opponent_name', 'Your opponent') || ' won this one.'
      else 'Your match against ' || coalesce(v_completion ->> 'opponent_name', 'your opponent') || ' ended in a tie.'
    end;

    if new.kind = 'solo' then
      insert into public.notification_events (user_id, category, title, body, data)
      values (
        v_key::uuid,
        'match_complete',
        v_title,
        v_body,
        jsonb_build_object('match_id', new.id, 'kind', 'solo') || v_completion
      );
    else
      for v_member in
        select user_id from public.team_members where team_id = v_key::uuid
      loop
        insert into public.notification_events (user_id, category, title, body, data)
        values (
          v_member.user_id,
          'match_complete',
          case when v_outcome = 'win' then 'Your team won!' else v_title end,
          case when v_outcome = 'win' then 'Your team beat ' || coalesce(v_completion ->> 'opponent_name', 'the opponents') || '.' else v_body end,
          jsonb_build_object('match_id', new.id, 'kind', 'team') || v_completion
        );
      end loop;
    end if;
  end loop;

  return new;
end;
$$;

create trigger matches_enqueue_complete_notifications
  after update on public.matches
  for each row execute function public.enqueue_match_complete_notifications();

-- Friend activity: a "friends"-audience feed post -> the author's friends.
create or replace function public.enqueue_friend_activity_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_name text;
  v_distance_miles numeric;
  v_friend record;
begin
  if not ('friends' = any(new.audiences)) then
    return new;
  end if;

  select display_name into v_author_name from public.profiles where id = new.user_id;

  select round((a.distance_meters / 1609.344)::numeric, 1)
    into v_distance_miles
    from public.activities a
    where a.id = new.activity_id;

  for v_friend in
    select friend_user_id as user_id from public.friendships where user_id = new.user_id
  loop
    insert into public.notification_events (user_id, category, title, body, data)
    values (
      v_friend.user_id,
      'friend_activity',
      coalesce(v_author_name, 'A friend') || ' completed a run',
      coalesce(v_author_name, 'A friend') || ' ran ' || coalesce(v_distance_miles::text, '0') || ' mi.',
      jsonb_build_object('post_id', new.id, 'author_id', new.user_id)
    );
  end loop;

  return new;
end;
$$;

create trigger feed_posts_enqueue_friend_activity
  after insert on public.feed_posts
  for each row execute function public.enqueue_friend_activity_notifications();
