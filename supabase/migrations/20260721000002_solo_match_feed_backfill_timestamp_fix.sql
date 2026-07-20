-- The previous migration's backfill inserted feed_posts rows with
-- created_at defaulting to now(), so every historical (often months-old)
-- test/completed solo match suddenly appeared in the feed as "posted 5
-- minutes ago" all at once. Correct those backfilled rows to use the
-- match's ends_at (when it actually completed) instead.

update public.feed_posts fp
set created_at = m.ends_at
from public.matches m
where fp.match_id = m.id
  and m.kind = 'solo'
  and fp.created_at > m.ends_at + interval '1 hour';
