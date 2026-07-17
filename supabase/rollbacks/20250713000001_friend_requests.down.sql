drop function if exists public.send_friend_request(uuid);
drop function if exists public.respond_to_friend_request(uuid, boolean);
drop function if exists public.cancel_friend_request(uuid);
drop function if exists public.get_friend_notifications();
drop function if exists public.has_friend_notifications();
drop table if exists public.friend_requests;
