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
    v_title := case
      when v_outcome = 'win' then 'You won!'
      when v_outcome = 'loss' then 'Match complete'
      else 'Match complete'
    end;
    v_body := case
      when v_outcome = 'win' then 'You beat ' || coalesce(v_completion ->> 'opponent_name', 'your opponent') || '.'
      when v_outcome = 'loss' then coalesce(v_completion ->> 'opponent_name', 'Your opponent') || ' won this one.'
      else 'Your match against ' || coalesce(v_completion ->> 'opponent_name', 'your opponent') || ' ended in a tie.'
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
          case when v_outcome = 'win' then 'Your team beat ' || coalesce(v_completion ->> 'opponent_name', 'the opponents') || '.' else v_body end,
          jsonb_build_object('match_id', new.id, 'kind', 'team') || v_completion
        );
      end loop;
    end if;
  end loop;

  return new;
end;
$$;
