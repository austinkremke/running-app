-- Companion to add_friend — removes the bidirectional friendship rows.

create or replace function public.remove_friend(p_friend_user_id uuid)
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

  delete from public.friendships
  where (user_id = v_user_id and friend_user_id = p_friend_user_id)
     or (user_id = p_friend_user_id and friend_user_id = v_user_id);
end;
$$;

revoke all on function public.remove_friend(uuid) from public;
grant execute on function public.remove_friend(uuid) to authenticated;
