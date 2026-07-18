drop trigger if exists friend_requests_enqueue_notification on public.friend_requests;
drop function if exists public.enqueue_friend_request_notification();

drop function if exists public.update_notification_preference(text, boolean);
drop function if exists public.get_my_notification_preferences();
drop function if exists public.delete_push_token(text);
drop function if exists public.upsert_push_token(text, text);

drop table if exists public.notification_events;
drop table if exists public.notification_preferences;
drop table if exists public.device_push_tokens;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display text;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'runner'
  );

  insert into public.profiles (id, display_name)
  values (new.id, display);

  insert into public.player_progress (user_id, total_xp)
  values (new.id, 0);

  insert into public.player_rank (user_id, competitive_rating)
  values (new.id, 1000);

  return new;
end;
$$;
