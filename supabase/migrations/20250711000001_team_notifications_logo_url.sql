-- Surface teams.logo_url on the team notifications RPC so invite/request
-- rows can show the team's real uploaded logo instead of always falling
-- back to the icon+accent badge.

create or replace function public.get_team_notifications()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(item order by item->>'created_at' desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', r.id,
      'kind', r.kind,
      'team_id', t.id,
      'team_name', t.name,
      'team_tag', t.tag,
      'team_logo_icon', t.logo_icon,
      'team_logo_accent', t.logo_accent,
      'team_logo_url', t.logo_url,
      'actor_id', actor.id,
      'actor_name', actor.display_name,
      'actor_avatar_url', actor.avatar_url,
      'actor_level', public.level_from_total_xp(coalesce(pp.total_xp, 0)::bigint),
      'created_at', r.created_at
    ) as item
    from public.team_membership_requests r
    join public.teams t on t.id = r.team_id
    -- For an invite (shown to the invited user) feature the inviter; for a
    -- request (shown to leaders) feature the requester.
    join public.profiles actor
      on actor.id = case when r.kind = 'invite' then r.created_by else r.user_id end
    left join public.player_progress pp on pp.user_id = actor.id
    where r.status = 'pending'
      and (
        (r.kind = 'invite' and r.user_id = auth.uid())
        or (r.kind = 'request'
            and public.team_role_for(r.team_id, auth.uid()) in ('leader', 'co-leader'))
      )
  ) items;
$$;

grant execute on function public.get_team_notifications() to authenticated;
