-- 20250708000002_team_logo_upload.sql added a p_logo_url parameter to
-- update_team via `create or replace function`, but that only replaces a
-- function with an identical signature — adding a 6th parameter created a
-- second overload instead of replacing the 5-parameter one. With both
-- overloads present, PostgREST's RPC call (which omits any parameter the
-- client didn't set) frequently matched more than one candidate and
-- errored ("Update team failed... something went wrong" client-side).
-- Drop the stale 5-parameter overload so only the 6-parameter version
-- (with p_logo_url) remains.

drop function if exists public.update_team(uuid, text, text, text, text);
