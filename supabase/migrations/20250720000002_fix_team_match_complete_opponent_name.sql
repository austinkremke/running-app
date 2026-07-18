-- Team completions key the opponent name as 'opponent_team_name', not
-- 'opponent_name' (that's solo-only) — the Phase 2 trigger read the wrong
-- key for team matches, producing "You beat null." Caught by a smoke test
-- against real completed-match data before this ever reached a device.

create or replace function public.enqueue_match_complete_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_completion jsonb;
  v_outcome text;
  v_opponent_name text;
  v_title text;
  v_body text;
  v_member record;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  for v_key, v_completion in
    select * from jsonb_each(coalesce(new.state_json -> 'completions', '{}'::jsonb))
  loop
    v_outcome := v_completion ->> 'outcome';
    v_opponent_name := coalesce(
      v_completion ->> case when new.kind = 'team' then 'opponent_team_name' else 'opponent_name' end,
      case when new.kind = 'team' then 'the opponents' else 'your opponent' end
    );

    v_title := case
      when v_outcome = 'win' then 'You won!'
      else 'Match complete'
    end;
    v_body := case
      when v_outcome = 'win' then 'You beat ' || v_opponent_name || '.'
      when v_outcome = 'loss' then v_opponent_name || ' won this one.'
      else 'Your match against ' || v_opponent_name || ' ended in a tie.'
    end;

    if new.kind = 'solo' then
      insert into public.notification_events (user_id, category, title, body, data)
      values (
        v_key::uuid,
        'match_complete',
        v_title,
        v_body,
        jsonb_build_object('match_id', new.id, 'kind', 'solo') || v_completion
      );
    else
      for v_member in
        select user_id from public.team_members where team_id = v_key::uuid
      loop
        insert into public.notification_events (user_id, category, title, body, data)
        values (
          v_member.user_id,
          'match_complete',
          case when v_outcome = 'win' then 'Your team won!' else v_title end,
          case when v_outcome = 'win' then 'Your team beat ' || v_opponent_name || '.' else v_body end,
          jsonb_build_object('match_id', new.id, 'kind', 'team') || v_completion
        );
      end loop;
    end if;
  end loop;

  return new;
end;
$$;
