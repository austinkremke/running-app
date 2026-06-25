-- Run Off reference data (rank tiers). Display names are mutable; ids are stable.

insert into public.rank_tiers (id, display_name, subtitle, icon, min_rating, sort_order)
values
  ('bronze', 'Bronze Runner', 'Just getting started', 'shield-bronze', 0, 1),
  ('silver', 'Silver Strider', 'Finding your pace', 'shield-silver', 1200, 2),
  ('gold', 'Gold Grinder', 'Consistent competitor', 'shield-gold', 1400, 3),
  ('elite', 'Elite Runner', 'Top tier athlete', 'shield-elite', 1600, 4),
  ('legend', 'Legend', 'Among the best', 'shield-legend', 1800, 5)
on conflict (id) do update set
  display_name = excluded.display_name,
  subtitle = excluded.subtitle,
  icon = excluded.icon,
  min_rating = excluded.min_rating,
  sort_order = excluded.sort_order;

-- Demo team for Phase C (join from Team tab).
insert into public.teams (id, name, tag, motto, logo_icon, logo_accent)
values (
  '11111111-1111-4111-8111-111111111111',
  'Road Warriors',
  'RWAR',
  'Run together. Win together.',
  'paw',
  'lime'
)
on conflict (id) do update set
  name = excluded.name,
  tag = excluded.tag,
  motto = excluded.motto,
  logo_icon = excluded.logo_icon,
  logo_accent = excluded.logo_accent;
