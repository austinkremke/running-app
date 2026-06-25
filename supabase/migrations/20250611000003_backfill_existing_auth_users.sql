-- Backfill Run Off rows for auth.users created before the handle_new_user trigger.

insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'runner'
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.player_progress (user_id, total_xp)
select u.id, 0
from auth.users u
left join public.player_progress pp on pp.user_id = u.id
where pp.user_id is null;

insert into public.player_rank (user_id, competitive_rating)
select u.id, 1000
from auth.users u
left join public.player_rank pr on pr.user_id = u.id
where pr.user_id is null;
