-- Rollback: remove level-gate enforcement and the feature_gates catalog.

drop trigger if exists feed_comments_feature_gate on public.feed_comments;
drop trigger if exists solo_match_challenges_accept_gate on public.solo_match_challenges;
drop trigger if exists solo_match_challenges_send_gate on public.solo_match_challenges;
drop trigger if exists match_queue_feature_gate on public.match_queue;
drop trigger if exists feature_gates_set_updated_at on public.feature_gates;

drop function if exists public.enforce_feed_comment_gate();
drop function if exists public.enforce_challenge_accept_gate();
drop function if exists public.enforce_challenge_send_gate();
drop function if exists public.enforce_ranked_queue_gate();
drop function if exists public.assert_feature_gate(text, uuid);
drop function if exists public.level_from_total_xp(numeric);

drop table if exists public.feature_gates;
