-- Fix: 20250702000001 added level_from_total_xp(numeric), duplicating the existing
-- level_from_total_xp(bigint) from 20250620000001 (achievements). The overload broke
-- generated-type resolution and left two copies of the curve on the server.
-- Drop the numeric overload; assert_feature_gate uses the original bigint helper.

drop function if exists public.level_from_total_xp(numeric);

create or replace function public.assert_feature_gate(p_feature_id text, p_user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gate public.feature_gates%rowtype;
  v_total_xp bigint;
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
