-- Provision avatar_url from OAuth metadata on sign-up (Google picture, etc.).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display text;
  avatar text;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'runner'
  );

  avatar := coalesce(
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data->>'picture'), ''),
    nullif(trim(new.raw_user_meta_data->>'photo'), '')
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, display, avatar);

  insert into public.player_progress (user_id, total_xp)
  values (new.id, 0);

  insert into public.player_rank (user_id, competitive_rating)
  values (new.id, 1000);

  return new;
end;
$$;
