-- Push notifications, Phase 3: enqueue-at-start match reminders.
-- "Time left in match" can't come from a simple insert/update event the way
-- Phase 2's triggers do — it's 3 future-dated rows per participant. This
-- piggybacks on the same match_participants insert trigger point Phase 2's
-- match_found notification uses, since that's the first moment a specific
-- user_id + the match's ends_at are both known together.

create or replace function public.enqueue_match_reminder_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_offset interval;
  v_label text;
  v_deliver_at timestamptz;
begin
  if new.user_id is null then
    return new;
  end if;

  select * into v_match from public.matches where id = new.match_id;

  if v_match.id is null or v_match.status <> 'active' then
    return new;
  end if;

  for v_offset, v_label in
    select * from (values
      ('1 day'::interval, '1 day'),
      ('12 hours'::interval, '12 hours'),
      ('1 hour'::interval, '1 hour')
    ) as offsets(offset_interval, label)
  loop
    v_deliver_at := v_match.ends_at - v_offset;

    if v_deliver_at > now() then
      insert into public.notification_events (user_id, category, title, body, data, deliver_at)
      values (
        new.user_id,
        'match_reminders',
        v_label || ' left in your match',
        'Get your run in — your match wraps up in ' || v_label || '.',
        jsonb_build_object('match_id', v_match.id, 'kind', v_match.kind),
        v_deliver_at
      );
    end if;
  end loop;

  return new;
end;
$$;

create trigger match_participants_enqueue_reminder_notifications
  after insert on public.match_participants
  for each row execute function public.enqueue_match_reminder_notifications();

-- A match reminder for a match that ends early (forfeit, cancellation) or
-- that's already been fully resolved should never fire — cancel any
-- still-pending reminders once the match leaves 'active'.
create or replace function public.cancel_match_reminders_on_non_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'active' and old.status = 'active' then
    update public.notification_events
      set status = 'skipped'
      where status = 'pending'
        and category = 'match_reminders'
        and (data ->> 'match_id')::uuid = new.id;
  end if;

  return new;
end;
$$;

create trigger matches_cancel_reminders_on_non_active
  after update on public.matches
  for each row execute function public.cancel_match_reminders_on_non_active();
