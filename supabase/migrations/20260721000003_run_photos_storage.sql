-- Run photo attachments: public storage bucket for photos attached to a run
-- from the "Lock in your run" screen, mirrors avatars storage setup.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'run-photos',
  'run-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "run_photos_storage_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'run-photos');

create policy "run_photos_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'run-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "run_photos_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'run-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'run-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "run_photos_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'run-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
