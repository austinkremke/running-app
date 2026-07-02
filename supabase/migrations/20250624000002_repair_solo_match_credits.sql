-- Repair solo match links when activities were stamped with the demo team match.
-- Also backfills credits for qualifying runs during an active solo match.

create or replace function public.repair_solo_match_activity_credits()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_points int;
  v_linked int := 0;
  v_credited int := 0;
begin
  for v_row in
    select
      a.id as activity_id,
      a.user_id,
      a.distance_meters,
      mp.match_id
    from public.activities a
    inner join public.match_participants mp
      on mp.user_id = a.user_id
    inner join public.matches m
      on m.id = mp.match_id
    where m.kind = 'solo'
      and m.status = 'active'
      and a.match_id is distinct from mp.match_id
      and not exists (
        select 1
        from public.match_activity_credits mac
        where mac.activity_id = a.id
      )
  loop
    update public.activities
      set match_id = v_row.match_id
      where id = v_row.activity_id;

    v_linked := v_linked + 1;

    v_points := public.match_points_for_distance(v_row.distance_meters::numeric);
    if v_points <= 0 then
      continue;
    end if;

    insert into public.match_activity_credits (activity_id, match_id, user_id, points_awarded)
    values (v_row.activity_id, v_row.match_id, v_row.user_id, v_points);

    update public.match_participants
      set points = points + v_points
      where match_id = v_row.match_id
        and user_id = v_row.user_id;

    v_credited := v_credited + 1;
  end loop;

  return jsonb_build_object(
    'linked', v_linked,
    'credited', v_credited
  );
end;
$$;

select public.repair_solo_match_activity_credits();

revoke all on function public.repair_solo_match_activity_credits() from public;
