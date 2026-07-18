drop trigger if exists feed_posts_enqueue_friend_activity on public.feed_posts;
drop function if exists public.enqueue_friend_activity_notifications();

drop trigger if exists matches_enqueue_complete_notifications on public.matches;
drop function if exists public.enqueue_match_complete_notifications();

drop trigger if exists match_participants_enqueue_found_notification on public.match_participants;
drop function if exists public.enqueue_match_found_notification();

drop trigger if exists solo_match_challenges_enqueue_notification on public.solo_match_challenges;
drop function if exists public.enqueue_friend_challenge_notification();

drop trigger if exists feed_comments_enqueue_notification on public.feed_comments;
drop function if exists public.enqueue_comment_notification();

drop trigger if exists feed_reactions_enqueue_notification on public.feed_reactions;
drop function if exists public.enqueue_like_notification();
