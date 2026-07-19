-- Milestone 09 Phase 3: verification tier for wearable-imported activities.
-- NULL means "not applicable" — native phone-tracked runs are the app's own
-- trusted source, not an import, and were never gated by this at all.
-- Only HealthKit-imported activities (Apple Watch / Garmin) get a tier.

alter table public.activities
  add column verification_status text
    check (verification_status in ('verified', 'unverified')),
  add column import_metadata jsonb;

comment on column public.activities.verification_status is
  'Set only for imported activities (e.g. HealthKit). NULL = native phone-tracked run, always trusted.';
comment on column public.activities.import_metadata is
  'Audit trail for the verification-tier decision on imports — source app, device, wasUserEntered, HR sample count, etc. Not all fields gate the tier; kept for tightening the policy later from observed data.';
