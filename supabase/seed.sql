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
