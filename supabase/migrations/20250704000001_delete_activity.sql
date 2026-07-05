-- Milestone 08: let a user delete their own activity from the run detail screen.
-- feed_posts.activity_id and match_activity_credits.activity_id are both
-- `on delete cascade`, so the feed post and any match credits clean up with it.
-- Match participant points already banked are not recomputed (v1 — allowed any time).

create or replace function public.delete_activity(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select user_id into v_owner
    from public.activities
    where id = p_activity_id;

  if v_owner is null then
    raise exception 'Activity not found';
  end if;

  if v_owner <> v_user_id then
    raise exception 'You can only delete your own runs';
  end if;

  delete from public.activities where id = p_activity_id;

  return jsonb_build_object('status', 'deleted');
end;
$$;

revoke all on function public.delete_activity(uuid) from public;
grant execute on function public.delete_activity(uuid) to authenticated;
