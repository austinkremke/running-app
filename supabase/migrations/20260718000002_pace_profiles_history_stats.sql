-- Pooled per-range stats alongside the thresholds so the run detail screen
-- can show a historical comparison (e.g. "12% more time in Workout than
-- usual") without re-downloading and re-scanning every recent track.

alter table public.user_pace_profiles
  add column avg_recovery_pct numeric not null default 0,
  add column avg_easy_pct numeric not null default 0,
  add column avg_workout_pct numeric not null default 0,
  add column avg_hard_pct numeric not null default 0,
  add column longest_workout_seconds numeric not null default 0,
  add column longest_hard_seconds numeric not null default 0;
