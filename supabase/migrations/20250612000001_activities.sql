-- Run Off Phase B: activity summaries in Postgres; full tracks in Storage.

create table public.activities (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  distance_meters double precision not null default 0 check (distance_meters >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  source text not null,
  external_id text,
  external_source text,
  match_id uuid,
  summary_json jsonb not null default '{}'::jsonb,
  polyline jsonb not null default '[]'::jsonb,
  track_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_user_started_at_idx
  on public.activities (user_id, started_at desc);

alter table public.activities enable row level security;

create policy "activities_select_own"
  on public.activities for select
  to authenticated
  using (auth.uid() = user_id);

create policy "activities_insert_own"
  on public.activities for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "activities_update_own"
  on public.activities for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "activities_delete_own"
  on public.activities for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- Private bucket for full ActivityRecord[] JSON blobs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activities',
  'activities',
  false,
  52428800,
  array['application/json']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "activities_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'activities'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "activities_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'activities'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "activities_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'activities'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "activities_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'activities'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
