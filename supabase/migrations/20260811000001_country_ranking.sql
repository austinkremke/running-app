-- Real per-country solo ranking. Previously "country rank" was just the
-- global rank number reused with a flag icon next to it — there was no
-- stored country to actually scope a ranking by. This adds one.

alter table public.profiles
  add column country_code text
  constraint profiles_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$');

-- Only indexes the users who've actually set one — most rows will be null
-- for a while, and only set rows are ever filtered on.
create index profiles_country_code_idx on public.profiles (country_code)
  where country_code is not null;

create or replace function public.set_my_country(p_country_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_normalized text := upper(p_country_code);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_country_code is not null and v_normalized !~ '^[A-Z]{2}$' then
    raise exception 'Invalid country code';
  end if;

  update public.profiles
    set country_code = v_normalized
    where id = v_user_id;
end;
$$;

revoke all on function public.set_my_country(text) from public;
grant execute on function public.set_my_country(text) to authenticated;

-- The client previously computed global rank position with two direct
-- `player_rank` count queries (no RPC existed). Replacing that with a single
-- RPC call — both because it's one round trip instead of two, and because
-- the country-scoped variant needs a join against `profiles` that's cleaner
-- to express here than as a PostgREST embedded-resource filter. One function
-- serves both cases: p_country_code omitted/null = global (drop-in
-- replacement for the old client-side query), set = country-scoped.
create or replace function public.get_solo_rank_position(
  p_rating numeric,
  p_country_code text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'position', (
      select count(*) + 1
      from public.player_rank pr
      join public.profiles p on p.id = pr.user_id
      where pr.competitive_rating > p_rating
        and (p_country_code is null or p.country_code = p_country_code)
    ),
    'total_players', (
      select count(*)
      from public.player_rank pr
      join public.profiles p on p.id = pr.user_id
      where (p_country_code is null or p.country_code = p_country_code)
    )
  );
$$;

grant execute on function public.get_solo_rank_position(numeric, text) to authenticated;
