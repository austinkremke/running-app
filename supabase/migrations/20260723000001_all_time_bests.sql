-- All-Time Personal Bests (premium, dev-gated for now): the chronological PR
-- progression for a distance — every run that set a new all-time best at the
-- time it happened, oldest to newest, ending at the current record.

create or replace function public.get_all_time_bests(
  p_user_id uuid default auth.uid(),
  p_distance_key text default null
)
returns table (activity_id uuid, split_seconds numeric, achieved_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with ordered as (
    select
      adr.activity_id,
      adr.split_seconds,
      a.started_at,
      min(adr.split_seconds) over (
        order by a.started_at
        rows between unbounded preceding and 1 preceding
      ) as prior_best
    from public.activity_distance_records adr
    join public.activities a on a.id = adr.activity_id
    where adr.user_id = p_user_id and adr.distance_key = p_distance_key
  )
  select activity_id, split_seconds, started_at as achieved_at
  from ordered
  where prior_best is null or split_seconds < prior_best
  order by started_at asc;
$$;

revoke all on function public.get_all_time_bests(uuid, text) from public;
grant execute on function public.get_all_time_bests(uuid, text) to authenticated;
