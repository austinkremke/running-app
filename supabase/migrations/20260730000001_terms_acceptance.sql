-- App Store Guideline 1.2 (UGC Safety) compliance: records that a user has
-- explicitly accepted the Terms of Use (zero-tolerance for objectionable
-- content/abusive users) before they can reach the main app. Client gates
-- navigation on this via `OnboardingTermsScreen`; this column is the
-- server-side record of that acceptance, called once per session via
-- `accept_terms()` after auth succeeds (idempotent — safe to call every
-- login, not just first signup).
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

create or replace function public.accept_terms()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
    set terms_accepted_at = now()
    where id = auth.uid();
$$;

revoke all on function public.accept_terms() from public;
grant execute on function public.accept_terms() to authenticated;
