-- Rollback: remove the delete_activity RPC.

drop function if exists public.delete_activity(uuid);
