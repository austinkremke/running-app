alter table public.user_pace_profiles
  drop column if exists avg_recovery_pct,
  drop column if exists avg_easy_pct,
  drop column if exists avg_workout_pct,
  drop column if exists avg_hard_pct,
  drop column if exists longest_workout_seconds,
  drop column if exists longest_hard_seconds;
