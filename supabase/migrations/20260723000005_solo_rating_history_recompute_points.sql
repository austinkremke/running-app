-- get_solo_rating_history was reading match_participants.points directly, which
-- is stale for any match finalized before 20260720000003_finalize_solo_match_
-- recompute_points.sql (that fix only recomputes at *new* finalize time, not
-- retroactively — same class of bug fetchSoloMatchFeedPosts hit and fixed the
-- same way). Older matches still showed 1-0 (an old placeholder value) instead
-- of the real score. Recompute both sides' points fresh via match_side_points
-- on every read, same as the feed does, and derive win/loss/tie from that
-- instead of the stored column.
create or replace function public.get_solo_rating_history(
  p_user_id uuid default auth.uid(),
  p_limit int default 50
)
returns table (
  match_id uuid,
  ended_at timestamptz,
  result text,
  my_points numeric,
  opponent_points numeric,
  opponent_id uuid,
  opponent_name text,
  opponent_avatar_url text,
  rating_before int,
  rating_after int,
  rating_delta int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id as match_id,
    m.ends_at as ended_at,
    case
      when public.match_side_points(m.id, mine.user_id) > public.match_side_points(m.id, theirs.user_id) then 'win'
      when public.match_side_points(m.id, mine.user_id) < public.match_side_points(m.id, theirs.user_id) then 'loss'
      else 'tie'
    end as result,
    public.match_side_points(m.id, mine.user_id) as my_points,
    public.match_side_points(m.id, theirs.user_id) as opponent_points,
    theirs.user_id as opponent_id,
    p.display_name as opponent_name,
    p.avatar_url as opponent_avatar_url,
    mine.rating_before,
    mine.rating_after,
    mine.rating_delta
  from public.matches m
  join public.match_participants mine
    on mine.match_id = m.id and mine.user_id = p_user_id
  join public.match_participants theirs
    on theirs.match_id = m.id and theirs.user_id is not null and theirs.user_id <> p_user_id
  left join public.profiles p on p.id = theirs.user_id
  where m.kind = 'solo'
    and m.status = 'completed'
    and mine.rating_after is not null
  order by m.ends_at desc
  limit p_limit;
$$;

revoke all on function public.get_solo_rating_history(uuid, int) from public;
grant execute on function public.get_solo_rating_history(uuid, int) to authenticated;
