-- Milestone 06 Phase 4: level-gated features.
-- feature_gates catalog (DB-first, tunable without app release) + server enforcement
-- via BEFORE triggers on the gated write paths. Level derived from player_progress.total_xp
-- with a SQL mirror of the client curve (same client/server duplication precedent as award_run_xp).

create table public.feature_gates (
  feature_id text primary key,
  display_name text not null,
  min_level int not null check (min_level >= 1),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feature_gates enable row level security;

create policy "feature_gates_select_authenticated"
  on public.feature_gates for select
  to authenticated
  using (true);

create trigger feature_gates_set_updated_at
  before update on public.feature_gates
  for each row execute function public.set_updated_at();

-- Mirrors src/services/levelCurve.ts: xpForLevelUp(L) = Math.round(120 * 1.09 ** L),
-- level capped at 98. floor(x + 0.5) reproduces JS Math.round for positive x.
-- Parity fixtures: src/services/__tests__/levelCurve.test.ts
create or replace function public.level_from_total_xp(p_total_xp numeric)
returns int
language plpgsql
immutable
as $$
declare
  v_level int := 1;
  v_cumulative numeric := 0;
  v_step numeric;
begin
  while v_level < 98 loop
    v_step := floor(120::double precision * power(1.09::double precision, v_level::double precision) + 0.5);
    exit when coalesce(p_total_xp, 0) < v_cumulative + v_step;
    v_cumulative := v_cumulative + v_step;
    v_level := v_level + 1;
  end loop;

  return v_level;
end;
$$;

-- Raises with user-facing copy when the user's level is below an active gate.
-- Unknown or inactive gates stay open.
create or replace function public.assert_feature_gate(p_feature_id text, p_user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gate public.feature_gates%rowtype;
  v_total_xp numeric;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_gate
    from public.feature_gates
    where feature_id = p_feature_id
      and is_active;

  if not found then
    return;
  end if;

  select total_xp
    into v_total_xp
    from public.player_progress
    where user_id = p_user_id;

  if public.level_from_total_xp(coalesce(v_total_xp, 0)) < v_gate.min_level then
    raise exception 'Reach level % to unlock %', v_gate.min_level, v_gate.display_name;
  end if;
end;
$$;

-- Ranked solo queue: gate any queue entry (covers enqueue_solo_matchmaking and future paths).
create or replace function public.enforce_ranked_queue_gate()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_feature_gate('ranked_solo_queue', new.user_id);
  return new;
end;
$$;

create trigger match_queue_feature_gate
  before insert on public.match_queue
  for each row execute function public.enforce_ranked_queue_gate();

-- Friend challenges: both sides must qualify (challenges affect Elo).
-- Send checked on challenge insert; accept checked on the pending -> accepted transition.
create or replace function public.enforce_challenge_send_gate()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_feature_gate('send_friend_challenge', new.challenger_id);
  return new;
end;
$$;

create trigger solo_match_challenges_send_gate
  before insert on public.solo_match_challenges
  for each row execute function public.enforce_challenge_send_gate();

create or replace function public.enforce_challenge_accept_gate()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'accepted' and old.status is distinct from new.status then
    perform public.assert_feature_gate('send_friend_challenge', new.challenged_id);
  end if;
  return new;
end;
$$;

create trigger solo_match_challenges_accept_gate
  before update on public.solo_match_challenges
  for each row execute function public.enforce_challenge_accept_gate();

-- Feed comments: direct table insert under RLS, so the trigger is the server check.
create or replace function public.enforce_feed_comment_gate()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_feature_gate('feed_comments', new.user_id);
  return new;
end;
$$;

create trigger feed_comments_feature_gate
  before insert on public.feed_comments
  for each row execute function public.enforce_feed_comment_gate();

revoke all on function public.level_from_total_xp(numeric) from public;
revoke all on function public.assert_feature_gate(text, uuid) from public;
grant execute on function public.level_from_total_xp(numeric) to authenticated;
grant execute on function public.assert_feature_gate(text, uuid) to authenticated;

-- Gate catalog (v1) — decided in milestones/06 Phase 4. create_team reserved until the feature ships.
insert into public.feature_gates (feature_id, display_name, min_level, is_active, sort_order)
values
  ('feed_comments', 'Comments', 2, true, 1),
  ('send_friend_challenge', 'Friend Challenges', 3, true, 2),
  ('ranked_solo_queue', 'Ranked Matchmaking', 5, true, 3),
  ('create_team', 'Team Creation', 10, false, 4)
on conflict (feature_id) do update set
  display_name = excluded.display_name,
  min_level = excluded.min_level,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
