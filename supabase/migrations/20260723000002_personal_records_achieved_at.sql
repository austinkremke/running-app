-- Adds achieved_at (the run's date) to get_personal_records so the Me page
-- can show and sort the top-3-per-distance list by date.

drop function if exists public.get_personal_records(uuid);

create function public.get_personal_records(p_user_id uuid default auth.uid())
returns table (distance_key text, rnk int, split_seconds numeric, activity_id uuid, achieved_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select distance_key, rnk, split_seconds, activity_id, achieved_at
  from (
    select
      adr.distance_key,
      adr.split_seconds,
      adr.activity_id,
      a.started_at as achieved_at,
      rank() over (partition by adr.distance_key order by adr.split_seconds asc) as rnk
    from public.activity_distance_records adr
    join public.activities a on a.id = adr.activity_id
    where adr.user_id = p_user_id
  ) ranked
  where rnk <= 3
  order by distance_key, rnk;
$$;

revoke all on function public.get_personal_records(uuid) from public;
grant execute on function public.get_personal_records(uuid) to authenticated;
