drop function if exists public.list_top_teams(int);

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

grant execute on function public.list_top_teams(int) to authenticated;
