-- Milestone 07 Phase 2: team competitive rating + real team stats.
-- team_rank mirrors player_rank (numbers only, no display strings); moves only
-- from team match results. get_team_overview/list_top_teams are security definer
-- because teammates' raw activities are RLS-protected.

create table public.team_rank (
  team_id uuid primary key references public.teams (id) on delete cascade,
  competitive_rating int not null default 1000 check (competitive_rating >= 0),
  season_wins int not null default 0,
  season_losses int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_rank enable row level security;

create policy "team_rank_select_authenticated"
  on public.team_rank for select
  to authenticated
  using (true);

create trigger team_rank_set_updated_at
  before update on public.team_rank
  for each row execute function public.set_updated_at();

-- Provision on team creation (covers create_team RPC and seeds).
create or replace function public.provision_team_rank()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_rank (team_id)
  values (new.id)
  on conflict (team_id) do nothing;

  return new;
end;
$$;

create trigger teams_provision_team_rank
  after insert on public.teams
  for each row execute function public.provision_team_rank();

-- Backfill existing teams.
insert into public.team_rank (team_id)
select id from public.teams
on conflict (team_id) do nothing;

-- Team Elo — system-only, invoked by team match finalize (Phase 4).
create or replace function public.apply_team_elo_match_result_system(
  p_winner_team_id uuid,
  p_loser_team_id uuid,
  p_k_factor int default 32
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner public.team_rank%rowtype;
  v_loser public.team_rank%rowtype;
  v_winner_expected double precision;
  v_loser_expected double precision;
  v_winner_delta int;
  v_loser_delta int;
  v_winner_rating int;
  v_loser_rating int;
begin
  if p_winner_team_id is null or p_loser_team_id is null then
    raise exception 'Winner and loser teams are required';
  end if;

  if p_winner_team_id = p_loser_team_id then
    raise exception 'Winner and loser must be different teams';
  end if;

  select * into v_winner from public.team_rank where team_id = p_winner_team_id for update;
  if not found then
    raise exception 'Winner team rank row not found';
  end if;

  select * into v_loser from public.team_rank where team_id = p_loser_team_id for update;
  if not found then
    raise exception 'Loser team rank row not found';
  end if;

  v_winner_expected := public.elo_expected_score(v_winner.competitive_rating, v_loser.competitive_rating);
  v_loser_expected := public.elo_expected_score(v_loser.competitive_rating, v_winner.competitive_rating);

  v_winner_delta := round(p_k_factor * (1.0 - v_winner_expected))::int;
  v_loser_delta := round(p_k_factor * (0.0 - v_loser_expected))::int;

  v_winner_rating := greatest(0, v_winner.competitive_rating + v_winner_delta);
  v_loser_rating := greatest(0, v_loser.competitive_rating + v_loser_delta);

  update public.team_rank
    set competitive_rating = v_winner_rating,
        season_wins = season_wins + 1
    where team_id = p_winner_team_id;

  update public.team_rank
    set competitive_rating = v_loser_rating,
        season_losses = season_losses + 1
    where team_id = p_loser_team_id;

  return jsonb_build_object(
    'winner_team_id', p_winner_team_id,
    'loser_team_id', p_loser_team_id,
    'winner_rating', v_winner_rating,
    'loser_rating', v_loser_rating,
    'winner_delta', v_winner_delta,
    'loser_delta', v_loser_delta
  );
end;
$$;

-- Real team stats for the Team tab: rating, rank position, season record, and
-- distance aggregates over current members (7-day rolling window).
create or replace function public.get_team_overview(p_team_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rank public.team_rank%rowtype;
  v_rank_position int;
  v_team_count int;
  v_week_meters numeric;
  v_total_meters numeric;
  v_member_week jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_rank from public.team_rank where team_id = p_team_id;
  if not found then
    raise exception 'Team not found';
  end if;

  select count(*) + 1
    into v_rank_position
    from public.team_rank
    where competitive_rating > v_rank.competitive_rating;

  select count(*) into v_team_count from public.team_rank;

  select
      coalesce(sum(a.distance_meters) filter (where a.started_at >= now() - interval '7 days'), 0),
      coalesce(sum(a.distance_meters), 0)
    into v_week_meters, v_total_meters
    from public.activities a
    join public.team_members tm on tm.user_id = a.user_id
    where tm.team_id = p_team_id;

  select coalesce(
      jsonb_agg(jsonb_build_object('user_id', mw.user_id, 'week_distance_meters', mw.meters)),
      '[]'::jsonb
    )
    into v_member_week
    from (
      select tm.user_id, coalesce(sum(a.distance_meters), 0) as meters
      from public.team_members tm
      left join public.activities a
        on a.user_id = tm.user_id
        and a.started_at >= now() - interval '7 days'
      where tm.team_id = p_team_id
      group by tm.user_id
    ) mw;

  return jsonb_build_object(
    'competitive_rating', v_rank.competitive_rating,
    'season_wins', v_rank.season_wins,
    'season_losses', v_rank.season_losses,
    'rank_position', v_rank_position,
    'team_count', v_team_count,
    'week_distance_meters', v_week_meters,
    'total_distance_meters', v_total_meters,
    'member_week', v_member_week
  );
end;
$$;

-- Top teams in one round-trip: real rating order + combined member XP for level display.
create or replace function public.list_top_teams(p_limit int default 50)
returns table (
  team_id uuid,
  name text,
  tag text,
  motto text,
  logo_icon text,
  logo_accent text,
  member_max int,
  member_count bigint,
  competitive_rating int,
  season_wins int,
  season_losses int,
  total_member_xp bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.name,
    t.tag,
    t.motto,
    t.logo_icon,
    t.logo_accent,
    t.member_max,
    count(tm.user_id) as member_count,
    tr.competitive_rating,
    tr.season_wins,
    tr.season_losses,
    coalesce(sum(pp.total_xp), 0)::bigint as total_member_xp
  from public.teams t
  join public.team_rank tr on tr.team_id = t.id
  left join public.team_members tm on tm.team_id = t.id
  left join public.player_progress pp on pp.user_id = tm.user_id
  group by t.id, tr.competitive_rating, tr.season_wins, tr.season_losses
  order by tr.competitive_rating desc, t.created_at asc
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function public.provision_team_rank() from public;
revoke all on function public.apply_team_elo_match_result_system(uuid, uuid, int) from public;
revoke all on function public.get_team_overview(uuid) from public;
revoke all on function public.list_top_teams(int) from public;

grant execute on function public.get_team_overview(uuid) to authenticated;
grant execute on function public.list_top_teams(int) to authenticated;
