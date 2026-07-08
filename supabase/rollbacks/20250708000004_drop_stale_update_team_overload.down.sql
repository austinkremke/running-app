create or replace function public.update_team(
  p_team_id uuid,
  p_name text default null,
  p_motto text default null,
  p_logo_icon text default null,
  p_logo_accent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text := public.team_role_for(p_team_id, v_user_id);
  v_name text := trim(coalesce(p_name, ''));
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_role not in ('leader', 'co-leader') then
    raise exception 'Only leaders can edit the team';
  end if;

  if p_name is not null and (length(v_name) < 3 or length(v_name) > 24) then
    raise exception 'Team name must be 3-24 characters';
  end if;

  if p_motto is not null and length(p_motto) > 80 then
    raise exception 'Motto must be 80 characters or fewer';
  end if;

  update public.teams
    set name = coalesce(nullif(v_name, ''), name),
        motto = coalesce(p_motto, motto),
        logo_icon = coalesce(p_logo_icon, logo_icon),
        logo_accent = coalesce(p_logo_accent, logo_accent)
    where id = p_team_id;
end;
$$;
