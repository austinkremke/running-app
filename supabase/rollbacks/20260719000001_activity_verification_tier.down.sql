alter table public.activities
  drop column if exists verification_status,
  drop column if exists import_metadata;
