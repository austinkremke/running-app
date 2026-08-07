-- App Store Guideline 1.2 (UGC Safety) compliance: a real content filter —
-- rejects (not silently strips) inserts/updates containing disallowed
-- language, on every free-text UGC surface. `blocked_terms` is a plain
-- table (not a hardcoded list) so it can be updated via Studio without a
-- redeploy.
create table public.blocked_terms (
  term text primary key,
  created_at timestamptz not null default now()
);

alter table public.blocked_terms enable row level security;
-- No select/insert/update/delete policies for authenticated users — this
-- table is only read from inside security definer functions below, and
-- only ever edited by the developer via Studio/service role.

insert into public.blocked_terms (term) values
  ('nigger'), ('nigga'), ('faggot'), ('fag'), ('retard'), ('retarded'),
  ('spic'), ('chink'), ('gook'), ('kike'), ('tranny'), ('cunt'),
  ('whore'), ('slut'), ('rape'), ('rapist'), ('pedo'), ('pedophile'),
  ('nazi'), ('kys'), ('kill yourself'),
  ('fuck'), ('shit'), ('bitch'), ('asshole'), ('bastard'), ('dick'),
  ('piss off'), ('cock'), ('pussy'), ('twat'), ('wanker'), ('motherfucker')
on conflict do nothing;

create or replace function public.contains_blocked_terms(p_text text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_terms bt
    where p_text ilike '%' || bt.term || '%'
  );
$$;

create or replace function public.enforce_feed_posts_content_filter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.contains_blocked_terms(coalesce(new.title, '') || ' ' || coalesce(new.description, '')) then
    raise exception 'CONTENT_REJECTED: this contains language that is not allowed';
  end if;
  return new;
end;
$$;

create trigger feed_posts_content_filter
  before insert or update on public.feed_posts
  for each row
  execute function public.enforce_feed_posts_content_filter();

create or replace function public.enforce_feed_comments_content_filter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.contains_blocked_terms(coalesce(new.body, '')) then
    raise exception 'CONTENT_REJECTED: this contains language that is not allowed';
  end if;
  return new;
end;
$$;

create trigger feed_comments_content_filter
  before insert or update on public.feed_comments
  for each row
  execute function public.enforce_feed_comments_content_filter();

create or replace function public.enforce_match_messages_content_filter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.contains_blocked_terms(coalesce(new.body, '')) then
    raise exception 'CONTENT_REJECTED: this contains language that is not allowed';
  end if;
  return new;
end;
$$;

create trigger match_messages_content_filter
  before insert or update on public.match_messages
  for each row
  execute function public.enforce_match_messages_content_filter();
