drop trigger if exists matches_cancel_reminders_on_non_active on public.matches;
drop function if exists public.cancel_match_reminders_on_non_active();

drop trigger if exists match_participants_enqueue_reminder_notifications on public.match_participants;
drop function if exists public.enqueue_match_reminder_notifications();
