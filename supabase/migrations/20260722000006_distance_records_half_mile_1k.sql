-- Adds 1/2 Mile and 1K to the distance milestone list (records + completion badges).

alter table public.activity_distance_records drop constraint activity_distance_records_distance_key_check;

alter table public.activity_distance_records add constraint activity_distance_records_distance_key_check
  check (
    distance_key in (
      'half_mile', 'one_k', 'mile', 'five_k', 'five_mile', 'ten_k', 'half_marathon', 'marathon'
    )
  );

insert into public.achievement_definitions
  (id, display_name, description, category, sort_order, tier, icon, xp_reward, criteria_type, criteria_json, is_active)
values
  ('half_mile', '1/2 Mile', 'Run half a mile in a single run.', 'performance', 17, 'bronze', 'flag-outline', 100, 'single_run_distance_miles', '{"miles": 0.5}', true),
  ('one_k', '1K', 'Run 1 kilometer in a single run.', 'performance', 18, 'bronze', 'flag-outline', 125, 'single_run_distance_miles', '{"miles": 0.621371}', true)
on conflict (id) do nothing;
