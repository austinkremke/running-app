-- Rollback: restore the numeric overload and the assert_feature_gate that used it
-- (state as of 20250702000001).

create or replace function public.level_from_total_xp(p_total_xp numeric)
returns int
language plpgsql
immutable
as $$
declare
  v_level int := 1;
  v_cumulative numeric := 0;
  v_step numeric;
begin
  while v_level < 98 loop
    v_step := floor(120::double precision * power(1.09::double precision, v_level::double precision) + 0.5);
    exit when coalesce(p_total_xp, 0) < v_cumulative + v_step;
    v_cumulative := v_cumulative + v_step;
    v_level := v_level + 1;
  end loop;

  return v_level;
end;
$$;

create or replace function public.assert_feature_gate(p_feature_id text, p_user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gate public.feature_gates%rowtype;
  v_total_xp numeric;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_gate
    from public.feature_gates
    where feature_id = p_feature_id
      and is_active;

  if not found then
    return;
  end if;

  select total_xp
    into v_total_xp
    from public.player_progress
    where user_id = p_user_id;

  if public.level_from_total_xp(coalesce(v_total_xp, 0)) < v_gate.min_level then
    raise exception 'Reach level % to unlock %', v_gate.min_level, v_gate.display_name;
  end if;
end;
$$;

revoke all on function public.level_from_total_xp(numeric) from public;
grant execute on function public.level_from_total_xp(numeric) to authenticated;
