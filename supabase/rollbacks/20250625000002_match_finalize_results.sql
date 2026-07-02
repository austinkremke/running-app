-- Rollback: restore int return type for finalize_due_solo_matches_for_user.

create or replace function public.finalize_due_solo_matches_for_user(p_user_id uuid default auth.uid())
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_count int := 0;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  for v_match_id in
    select m.id
    from public.matches m
    join public.match_participants mp on mp.match_id = m.id
    where mp.user_id = p_user_id
      and m.kind = 'solo'
      and m.status = 'active'
      and m.ends_at <= now()
  loop
    perform public.finalize_solo_match(v_match_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.finalize_due_solo_matches_for_user(uuid) to authenticated;
