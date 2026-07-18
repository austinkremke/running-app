-- Push notifications, Phase 1: delivery pipeline scaffolding.
-- device_push_tokens (where to send), notification_preferences (whether to
-- send, per category), notification_events (outbox the delivery worker
-- drains). Only the friend_requests trigger is wired in this phase, to prove
-- the pipe end-to-end; the rest of the event sources follow in Phase 2.

create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index device_push_tokens_user_id_idx on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

create policy "device_push_tokens_select_self"
  on public.device_push_tokens for select
  to authenticated
  using (auth.uid() = user_id);

create trigger device_push_tokens_set_updated_at
  before update on public.device_push_tokens
  for each row execute function public.set_updated_at();

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  likes boolean not null default true,
  comments boolean not null default true,
  friend_requests boolean not null default true,
  friend_challenge boolean not null default true,
  match_found boolean not null default true,
  match_reminders boolean not null default true,
  match_complete boolean not null default true,
  friend_activity boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_select_self"
  on public.notification_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Seed a default-all-on preferences row alongside the rest of a new user's
-- provisioning rows.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display text;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'runner'
  );

  insert into public.profiles (id, display_name)
  values (new.id, display);

  insert into public.player_progress (user_id, total_xp)
  values (new.id, 0);

  insert into public.player_rank (user_id, competitive_rating)
  values (new.id, 1000);

  insert into public.notification_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

-- Backfill preference rows for existing users so the update above doesn't
-- leave anyone without one.
insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- Outbox the delivery worker drains. A row here means "something to tell
-- this user" — the worker joins tokens + preferences at send time, not here,
-- so toggling a preference off suppresses already-queued rows too.
create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in (
    'likes', 'comments', 'friend_requests', 'friend_challenge',
    'match_found', 'match_reminders', 'match_complete', 'friend_activity'
  )),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  deliver_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notification_events_pending_idx
  on public.notification_events (deliver_at)
  where status = 'pending';

alter table public.notification_events enable row level security;

create policy "notification_events_select_self"
  on public.notification_events for select
  to authenticated
  using (auth.uid() = user_id);

-- RPCs: token lifecycle.

create or replace function public.upsert_push_token(p_token text, p_platform text)
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

  if p_platform not in ('ios', 'android') then
    raise exception 'Invalid platform';
  end if;

  insert into public.device_push_tokens (user_id, expo_token, platform)
  values (v_user_id, p_token, p_platform)
  on conflict (expo_token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

grant execute on function public.upsert_push_token(text, text) to authenticated;

create or replace function public.delete_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.device_push_tokens
  where expo_token = p_token
    and user_id = auth.uid();
end;
$$;

grant execute on function public.delete_push_token(text) to authenticated;

-- RPCs: preferences.

create or replace function public.get_my_notification_preferences()
returns public.notification_preferences
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.notification_preferences
  where user_id = auth.uid();
$$;

grant execute on function public.get_my_notification_preferences() to authenticated;

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
    'likes', 'comments', 'friend_requests', 'friend_challenge',
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

grant execute on function public.update_notification_preference(text, boolean) to authenticated;

-- Event source, Phase 1: friend requests. Proves the outbox pipe end-to-end
-- before the rest of the event sources are wired in Phase 2.

create or replace function public.enqueue_friend_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_name text;
begin
  select display_name into v_from_name from public.profiles where id = new.from_user_id;

  insert into public.notification_events (user_id, category, title, body, data)
  values (
    new.to_user_id,
    'friend_requests',
    'New friend request',
    coalesce(v_from_name, 'Someone') || ' wants to be your friend.',
    jsonb_build_object('friend_request_id', new.id, 'from_user_id', new.from_user_id)
  );

  return new;
end;
$$;

create trigger friend_requests_enqueue_notification
  after insert on public.friend_requests
  for each row execute function public.enqueue_friend_request_notification();
