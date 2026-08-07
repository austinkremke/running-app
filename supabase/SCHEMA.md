# Database schema overview

> **Source of truth:** `supabase/migrations/*.sql`.  
> **Generated types:** `src/types/database.ts` via `supabase gen types typescript`.  
> **Design doc:** [milestones/02-supabase-backend.md](../milestones/02-supabase-backend.md)

This file is a **human/AI-readable index**. After every migration, update the table list below and regenerate types.

---

## Schema workflow (required)

1. **Change schema** → add SQL file under `supabase/migrations/`.
2. **Add rollback** → companion `supabase/rollbacks/<same-timestamp>_<slug>.down.sql` to undo the migration if needed.
3. **Apply remotely** → `supabase db push` (linked `run-off` project).
4. **Apply locally** → `supabase db reset` or `supabase migration up`.
5. **Regenerate types** → `supabase gen types typescript --linked > src/types/database.ts` (remote) or `--local` after local reset.
6. **Commit together** → migration + rollback + `database.ts` (+ `seed.sql` if reference data changed).
7. **Update this file** if tables or FK relationships changed.
8. **Docs sync** — run [run-off SKILL checklist](../.cursor/skills/run-off/SKILL.md#docs-sync-on-ship-required): README, milestones, AGENTS, skill.

**Revert a migration (manual):** `supabase db execute --file supabase/rollbacks/<timestamp>_<slug>.down.sql`

**Before any DB work**, agents must read migrations + `src/types/database.ts` — not hand-rolled interfaces or mock types.

---

## Design rules

### Reference data → Postgres (not duplicated in app code)

Catalog tables with stable `id` + mutable display fields:

- `rank_tiers` — title, subtitle, icon, `min_rating` (rename “Bronze” → “Wood” via `display_name` update)
- `match_types`, `achievement_definitions`, etc. as needed

**Seed** reference rows in `supabase/seed.sql`. Use FKs where rows reference catalogs.

### User state → numbers and FKs, never display strings

| Store on user | Do not store |
|---------------|--------------|
| `competitive_rating` (number) | `rank_title: "Bronze Runner"` |
| `total_xp` (number) | `level_display_name` |
| optional `tier_id` → `rank_tiers.id` | copy of tier title on profile |

**Derive tier at read time:** `tier = highest rank_tiers row where min_rating <= competitive_rating`  
(or join on `tier_id` if cached).

### Keep in app config (for now)

- Level XP curve formulas (`levelCurve.ts`) until live ops needs DB tuning
- UI animation, colors, map tokens
- Pure presentation helpers

---

## Auth & user provisioning (Phase A — first backend work)

**Yes — getting users into the database is step one.** When someone creates an account in the app:

1. **Supabase Auth** inserts into `auth.users` (OAuth or email).
2. **`handle_new_user` trigger** (migration) inserts `profiles`, `player_progress`, `player_rank` in one transaction.
3. **App** persists the session and reads `profiles` by `session.user.id`.

The app never writes to `auth.users`. Provisioning is **server-side only** (trigger), not a client `ensureProfile()` call.

Full plan: [02-supabase-backend.md — Phase A](../milestones/02-supabase-backend.md#phase-a--auth--user-provisioning-first-step).

---

## Planned tables (v1)

```
auth.users                    — Supabase Auth (managed; trigger source)

profiles                      — id → auth.users, display_name, avatar_url, team_id, onboarding_completed_at?, …
                              — CREATED BY TRIGGER on auth.users INSERT

player_progress               — user_id → profiles, total_xp (default 0)
player_rank                   — user_id → profiles, competitive_rating (default 1000), season_wins, season_losses
                              — CREATED BY TRIGGER with profiles

rank_tiers                    — id, display_name, subtitle, icon, min_rating, sort_order (SEED)
xp_ledger                     — id, user_id, amount, source, breakdown_json, …

activities                    — id, user_id, started_at, ended_at, distance_meters, duration_seconds,
                              — source, summary_json, polyline (jsonb), track_storage_path,
                              — verification_status ('verified'|'unverified'|NULL), import_metadata (jsonb)
                              — Storage: activities/{user_id}/{activity_id}/track.json

teams / team_members            — logo (icon/accent, or optional custom logo_url), tag, motto; one team per user (v1)
feed_posts                      — activity_id FK (nullable) or match_id FK (nullable), exactly one set; audiences[], caption fields

matches / match_participants / match_results
match_messages                  — match_id, user_id, body, created_at (Realtime chat)
match_types                     — reference catalog (seed)
feed_reactions                  — post_id, user_id, reaction (like); PK (post_id, user_id)
feed_comments                   — post_id, user_id, body, created_at

friendships                     — user_id, friend_user_id (bidirectional rows via add_friend RPC)
solo_match_challenges           — challenger_id, challenged_id, status, match_type_id, match_id?, expires_at
achievement_definitions         — catalog, criteria_type, criteria_json, xp_reward (seed)
user_achievements               — user_id, achievement_id, unlocked_at
achievement_events              — user_id, event_type (review, notifications, social follow, share)
feature_gates                   — feature_id, display_name, min_level, is_active (seed; level-gated features)
team_rank                       — team_id → teams, competitive_rating (default 1000), season W/L (trigger-provisioned)
team_match_queue                — team_id, match_type_id, competitive_rating, status, enqueued_by (team matchmaking)
team_membership_requests        — team_id, kind (invite|request), user_id, created_by, status (invites + join requests)
user_pace_profiles              — user_id, recovery/easy/workout_threshold_sec, run_count, sample_count, confidence, avg_*_pct, longest_workout/hard_seconds (cached personalized Pace Distribution ranges, client-computed)

content_reports                 — reporter_id, content_type, content_id, reported_user_id?, reason?, status (open|actioned|dismissed)
blocked_users                   — blocker_id, blocked_id (composite PK); bidirectional hide plumbed into can_view_feed_post + feed_posts select policies
blocked_terms                   — term (PK); plain data table backing the content-filter triggers, editable via Studio
```

**Phase A ships:** `profiles`, `player_progress`, `player_rank`, trigger, RLS, `rank_tiers` seed.  
**Phase B ships:** `activities` table + `activities` Storage bucket; sync on run stop.  
**Phase C ships:** `teams`, `team_members`, `feed_posts`, `profiles.team_id`; feed + team UI from server; feed route preview from `activities.polyline`.  
**Phase D ships:** `match_types`, `matches`, `match_participants`; active match screens + `activities.match_id`.  
**Phase 4 ships:** `xp_ledger`, `award_run_xp` / `bootstrap_progression_from_local` RPCs, progression columns on `player_progress`, social read-all RLS for levels on feed.  
**05 Phase 1 ships:** `feed_reactions`, `feed_comments`, `can_view_feed_post` RLS helper; engagement counts aggregated in feed fetch.  
**05 Phase 2 ships:** `apply_elo_match_result` RPC; client `player_rank` updates revoked; tier resolved from `rank_tiers` at read time.  
**05 Phase 3 ships:** `friendships`, `add_friend` RPC, friends feed RLS; `can_view_feed_post` includes friends audience.  
**05 Phase 4 (shipped):** `match_queue`, solo matchmaking RPCs, `credit_match_activity`, `finalize_solo_match` → Elo. See [05-matchmaking-and-feed.md](../milestones/05-matchmaking-and-feed.md#phase-4--matchmaking-shipped).  
**05 Phase 5 (shipped):** `match_messages`; Realtime publication on `match_participants`, `activities`, `matches`, `match_messages`. See [05-matchmaking-and-feed.md](../milestones/05-matchmaking-and-feed.md#phase-5--real-time-polish-shipped).  
**05 Phase 6 (shipped):** `solo_match_challenges`; completion persistence in `matches.state_json`; `get_my_solo_match_completions`, `forfeit_solo_match`, friend-challenge RPCs; `evaluate_achievements_system` for system finalize. See [05-matchmaking-and-feed.md](../milestones/05-matchmaking-and-feed.md#phase-6--solo-match-ux-challenges--forfeit-shipped).  
**06 Phase 2 (shipped):** `achievement_definitions`, `user_achievements`, `achievement_events`; `evaluate_achievements` + `record_achievement_event` RPCs. See [06-account-gating-and-cosmetics.md](../milestones/06-account-gating-and-cosmetics.md#phase-2--achievements).  
**06 Phase 1 (shipped):** `avatars` storage bucket, `delete_own_account` RPC.  
**06 Phase 4 (shipped):** `feature_gates` catalog + seed; `assert_feature_gate`; BEFORE triggers gate `match_queue` insert (L5), `solo_match_challenges` insert/accept (L3), `feed_comments` insert (L2). See [06-account-gating-and-cosmetics.md](../milestones/06-account-gating-and-cosmetics.md#phase-4--level-blocking-features-shipped).

**Post–Phase D RLS fixes:** `20250615000001_fix_match_participants_rls.sql`, `20250616000001_fix_feed_posts_rls.sql` — security definer helpers to avoid policy recursion.  
**05 Phase 1:** `20250618000001_feed_likes_comments.sql`.  
**05 Phase 2:** `20250619000001_elo_rank_rpc.sql`.  
**05 Phase 3:** `20250621000001_friends_graph.sql`.  
**05 Phase 4:** `20250623000001_matchmaking.sql`, `20250623000002_match_activities_rls.sql`.  
**05 Phase 5:** `20250624000001_match_realtime.sql`, `20250624000002_repair_solo_match_credits.sql` (repair: re-credit solo match points).  
**05 Phase 6:** `20250625000001_match_pace_scoring.sql`, `20250625000002_match_finalize_results.sql`, `20250625000003_persist_match_completion.sql`, `20250625000004_solo_completion_sync.sql`, `20250625000005_fix_finalize_achievements.sql`, `20250625000006_solo_friend_challenges.sql`, `20250625000007_solo_match_forfeit.sql`.  
**06 Phase 2:** `20250620000001_achievements.sql`.  
**06 Phase 1:** `20250622000001_account_settings.sql`.  
**06 Phase 4:** `20250702000001_feature_gates.sql`, `20250702000002_fix_level_fn_overload.sql`.  
**07 Phase 1:** `20250703000001_team_management.sql` — team management RPCs; leader-succession + empty-team-disband triggers on `team_members`; `create_team` gate activated.  
**07 Phase 2:** `20250703000002_team_rank_and_stats.sql` — `team_rank` + provisioning trigger/backfill; `apply_team_elo_match_result_system`; `get_team_overview` / `list_top_teams` RPCs.  
**07 Phase 3:** `20250703000003_team_matchmaking.sql` — `team_match_queue`; `enqueue_team_matchmaking` / `cancel_team_matchmaking` / `get_team_matchmaking_status`; `try_pair_team_queue` + `enroll_team_roster` (roster snapshot at pairing).  
**07 invites/requests:** `20250703000004_team_membership_requests.sql` — `team_membership_requests`; `invite_to_team` / `request_to_join_team` / `respond_to_team_invite` / `respond_to_join_request` / `cancel_team_membership_request` / `get_team_notifications` / `has_team_notifications`.  
**07 Phase 4:** `20250707000003_team_match_finalize.sql` — `finalize_team_match` (top-5 point-earners per side from synced `activities` in the match window → win/loss/tie → `apply_team_elo_match_result_system` → persist per-team completion in `state_json.completions`); `finalize_due_team_matches_for_user` / `get_my_team_match_completions` (client-facing, mirror the solo finalize/fetch pair). Also `20250707000001_activities_select_team_match.sql` — permissive RLS so match participants can read both rosters' `activities`.  
**08 run detail:** `20250704000001_delete_activity.sql` — `delete_activity` RPC (own activity; cascades feed post + match credits). Mile splits ride in `activities.summary_json.splits` (no schema change).  
**07 copy fix:** `20250705000001_team_3day_top_n_copy.sql` — updates `match_types` (`team_3day`) `overview`/`scoring_details` to describe top-N contributor scoring instead of the pre-decision "lineup" copy.
**Solo match finalize points fix:** `20260720000003_finalize_solo_match_recompute_points.sql` — `finalize_solo_match` decided the winner and persisted the final score from `match_participants.points`, which only updates via the client's `credit_match_activity` RPC and can lag behind `ends_at` (same fragile-column class of bug as the earlier `SoloMatchScreen` fix, just server-side) — a match could finalize as a 0-0 tie for a player who was genuinely leading. New `match_side_points(match_id, user_id)` SQL helper recomputes each side's points authoritatively from `activities` (mirrors `match_points_for_activity`, same function `credit_match_activity` uses) and writes the corrected value back into `match_participants.points` at finalize time — every downstream reader (`persist_solo_match_completions`, `finalize_due_solo_matches_for_user`, the completion drawer) already reads that column fresh, so fixing it once here was sufficient. **Team match finalize (`finalize_team_match`) was not audited for the same risk** — worth checking if team match results ever look wrong.
**Premium Pace Distribution (run detail):** `20260718000001_pace_profiles.sql` + `20260718000002_pace_profiles_history_stats.sql` — `user_pace_profiles` (self-only RLS); client computes personalized pace-range boundaries from smoothed moving pace pooled across the last ~90 days of tracks (`paceProfileService.ts`), caches the result, and refreshes every 7 days. Per-activity distribution/classification lives in `paceDistributionService.ts` (`PaceDistributionCard` on `RunDetailScreen`, owner-only for now — no paywall gating yet, shows full analysis to everyone per product decision).
**Premium Climbing Analysis (run detail):** no schema change — `climbingAnalysisService.ts` reuses `paceSegments.ts`'s smoothed/grade-adjusted windows (shared with Pace Distribution) to detect significant climbs (gap-bridged over brief flat/down noise, min ~0.25mi + 50ft gain), classify terrain (downhill/flat/gentle/moderate/steep uphill), per-climb thirds-based pacing (steady/fade/strong finish), downhill classification (reuses `user_pace_profiles` thresholds), and overall route classification. `ClimbingAnalysisCard` renders below `PaceDistributionCard` on `RunDetailScreen`, owner-only, ungated. No cross-run climbing history or matched-climb (same-route) comparison yet.
**Premium Heart Rate Analysis (run detail):** no schema change — `heartRateSamples.ts` cleans raw `ActivityRecord.heartRateBpm` (implausible range, stuck-sensor flatlines, isolated one-sample spikes) before `heartRateAnalysisService.ts` builds personalized zones from this run's own observed sustained max (no stored user max/resting/lactate-threshold HR exists — labeled as an estimate), zone distribution, cardiovascular-profile classification, HR drift (steady runs only), pace/HR relationship, and sustained high-HR segments (same gap-bridging pattern as climb detection). `HeartRateAnalysisCard` renders below `ClimbingAnalysisCard`, owner-only, ungated. `heartRateBpm` is never populated by phone-GPS tracking, so this still renders its "unavailable" state for phone-tracked runs — but as of milestone 09 Phase 1-3, activities synced in via HealthKit (Apple Watch or Garmin) **do** carry real `heartRateBpm`, so this card now activates for those.
**Solo match feed posts:** `20260721000001_solo_match_feed_posts.sql` — mirrors `20250708000001_team_match_feed_posts.sql` for 1v1 matches. `finalize_solo_match` now also writes `result`/`home_points`/`away_points` into `state_json` (previously only `match_participants.points` was updated) and inserts a `feed_posts` row (`match_id`, empty `audiences`) the first time a solo match completes, reusing the same `feed_posts.match_id` column/constraint the team match feature added. New RLS policy `feed_posts_select_solo_match` + an added branch in `can_view_feed_post` scope visibility to the two participants or their friends. Client: `fetchSoloMatchFeedPosts` (`matchService.ts`, mirrors `fetchTeamMatchFeedPosts`) joins `feed_posts` → `matches` → `match_participants` → `profiles`, plus `fetchPlayerRankTierIds` (mirrors `fetchTeamRankTierIds`) so runner avatars get the same `RankBorderAvatar` tier-color ring team logos already get; `SoloMatchFeedCard.tsx` (styled identically to `TeamMatchFeedCard.tsx`) renders alongside run/team-match cards in the feed via a third `FeedItem.kind` (`useFeed.ts`, `FeedScreen.tsx`). Backfilled `feed_posts`/`state_json.result` for solo matches that completed before this migration shipped — the backfill initially set `created_at = now()`, making months-old test matches all appear as "posted 5 minutes ago" simultaneously; fixed in `20260721000002_solo_match_feed_backfill_timestamp_fix.sql` (`created_at` corrected to each match's `ends_at`). `fetchSoloMatchFeedPosts` no longer trusts `matches.state_json.home_points`/`away_points`/`result` at all — those can still be stale for matches finalized before the points-recompute fix (`20260720000003_finalize_solo_match_recompute_points.sql`), same as `match_participants.points` was; it now recomputes both sides' points fresh from `activities` every read (mirrors `mapSoloMatchRow`/`fetchSoloMatchById`), which is why the match detail screen was already showing the right score while the feed card wasn't.
**Completed match detail view (feed tap-through):** no schema change. Tapping a `SoloMatchFeedCard`/`TeamMatchFeedCard` in the feed now navigates to the existing `SoloMatchScreen`/`TeamMatchScreen` in a read-only mode, reusing all the same live-match UI instead of building separate detail screens. New `fetchSoloMatchById(matchId)`/`fetchTeamMatchById(matchId)` (`matchService.ts`) mirror `fetchActiveSoloMatch`/`fetchActiveTeamMatch` but read any match by id regardless of `status` (the active-match fetchers hard-filter `status = 'active'`, so they can never return a completed match) and resolve sides from `match_participants.side`/`teams` directly instead of the current viewer's enrollment. New lightweight `useSoloMatchById`/`useTeamMatchById` hooks (no polling/expiry/realtime — those only make sense for the viewer's own in-progress match) back the screens when a `matchId` prop is passed; `ActiveSoloMatch`/`ActiveTeamMatch` gained a `status: 'active' | 'completed'` field (populated in `mapSoloMatchRow`/`mapTeamMatchRow` from `matches.status`) so `SoloMatchScoreboard`/`TeamMatchScoreboard` can swap the live countdown for a "MATCH COMPLETE" + winner indicator, and the screens hide forfeit/chat/run actions when read-only. New `AppRoute`s `soloMatchDetail`/`teamMatchDetail` in `routes.ts`/`AppShell.tsx` (mirrors the existing `runDetail` push pattern).
**09 Phase 1-3 (shipped):** `20260719000001_activity_verification_tier.sql` — adds `activities.verification_status`/`import_metadata` (NULL for native phone-tracked runs, set only for imports). `20260719000002_gate_xp_and_match_credit_on_verification.sql` — `award_run_xp`/`credit_match_activity` return zero/skipped for `verification_status = 'unverified'`, otherwise unchanged (NULL, i.e. native runs, is unaffected). `healthKitService.ts` (Nitro-based `@kingstinct/react-native-healthkit`, config plugin in `app.config.js`) reads workouts/routes/HR read-only; `healthKitMappers.ts` builds `ActivityRecord[]` from either a GPS route (Apple Watch) or a route-less time grid (Garmin — confirmed Garmin never syncs `HKWorkoutRoute` to Health); `healthKitVerification.ts` computes the permissive Verified/Unverified tier; `healthKitDedup.ts` guards against the same run cross-posting into Health via multiple apps (e.g. Garmin + Strava both writing separate `HKWorkout`s for one run — close start time + close distance ⇒ skip). `healthKitSyncService.ts.syncHealthKitWorkouts(userId)` orchestrates fetch → map → verify → dedup → **auto-publish** (upserts into `activities` with `id = HKWorkout.uuid` for idempotent re-sync, uploads the track, calls `award_run_xp`/`credit_match_activity` same as a native run, **and creates the matching `feed_posts` row** via `createFeedPost` — the feed is driven by `feed_posts`, not `activities`, and native runs need an explicit "Add to feed" tap to get one; found and fixed after synced imports weren't appearing in the feed). Triggered by a real "Sync Apple Watch & Garmin runs" row in Settings (plus a `__DEV__`-only raw smoke-test row). **Deliberately auto-publish, not review-first** — the seam for a future review-before-publish flow is called out directly in `healthKitSyncService.ts`'s docblock (right before the upsert), so switching later doesn't require re-deriving the fetch/map/verify/dedup pipeline. `ActivityRecord.latitude`/`longitude` are nullable (blocking type change, done — `activityPolyline.ts`/`activityAdapters.ts` made null-safe). **Known gotchas**: `queryQuantitySamples`'s `filter: { workout }` silently returns zero results even when real samples exist in that workout's window; use `filter: { date: { startDate, endDate } }` instead. Also, HealthKit UUIDs are uppercase but Postgres returns `uuid` columns lowercase — the "already imported" comparison must lowercase both sides or re-syncs misreport as cross-app duplicates. **Not yet wired**: Phase 4 background sync (manual "Sync Now" only, for now). See [milestones/09-wearable-integration.md](../milestones/09-wearable-integration.md).

**Run photo attachments:** `20260721000003_run_photos_storage.sql` — new public `run-photos` Storage bucket (mirrors `avatars`: public read, own-folder write via `storage.foldername(name)[1] = auth.uid()`). No new table — reuses the existing `feed_posts.photo_url` column (already single-URL, previously unused by real runs). On the "Lock in your run" screen (`PostRunScreen`/`PostRunMediaCarousel`), the runner can take a photo or pick one from their library (`runPhotoUpload.ts` — `pickRunPhotoUri`/`uploadRunPhoto`, same upload-raw-`arrayBuffer` pattern as `profileAvatar.ts`) and remove it before posting; both "Add to feed" call sites (`RunScreen.handleAddToFeed` for native runs, `PendingActivityConfirmationContext.handleAddToFeed` for HealthKit-synced runs) upload the photo and pass `photoUrl` through to `publishActivityToFeed`/`createFeedPost`. Feed cards and `RunDetailScreen` both render photo+route through a new shared `RunMediaCarousel` (`src/components/feed/RunMediaCarousel.tsx`) — when a run has both, it's a swipeable two-slide carousel with dot indicators (slide 1: photo + a peeking sliver of the map, roughly matching the photo's width; slide 2: full-width map), photo-only or route-only runs just render that single media full width. Replaces the old static side-by-side `RunCardMedia`. Still single-photo only (`photo_url` is a scalar column) — multi-photo would need a child table or an array column.

**Social tab split — Feed / Leaderboards:** no schema change. Bottom nav "Feed" renamed to "Social" (`BottomAppBar.tsx`, route `key: 'feed'` unchanged to avoid touching every `AppRoute`/`activeRoute` reference); the Social screen now has a top-level Feed/Leaderboards switcher (`AppShell.tsx` `activeSocialTab` state, `SOCIAL_TABS`) above the existing Community/Friends/Team row (which only shows in Feed mode). New `LeaderboardsScreen.tsx` + `PlayerLeaderboardCard` show players ranked by solo `player_rank.competitive_rating` with their season W-L record. New `listTopPlayers()` (`src/services/rank/topPlayersService.ts`) queries `player_rank` ordered by `competitive_rating desc` joined to `profiles` client-side — no new RPC needed since `player_rank_select_authenticated` RLS already permits `using (true)` (any authenticated user can read any row), unlike `list_top_teams` which needed a security-definer RPC to aggregate across teams.
**Leaderboards merge (Solo/Team) + public team view:** the standalone `TopTeamsScreen`/`'topTeams'` route is retired — `LeaderboardsScreen` now has its own SOLO/TEAM mode toggle (`TabAppHeader`, compact) and a search row (`TopTeamsSearchRow`, generalized with a `placeholder` prop) filtering whichever list is active; team mode reuses `listTopTeams()`/`TopTeamsTeamCard` (now a `Pressable` — previously not tappable at all). Tapping a team (from the leaderboard, from anywhere in the future) opens a new **public team view** — `PublicTeamScreen.tsx`, reached via a new `'teamDetail'` `AppRoute` (`hideChrome: true`, self-contained header like `UserProfileScreen`) — showing the same `TeamTopSection`/`TeamStatsSection`/`TeamMembersSection` as the owner's Team tab, but with no invite button, no member ⋮ management menu, and no recent-activity section (team `feed_posts` are member-gated by RLS anyway, so a non-member's query would come back empty regardless). Backed by new `fetchTeamById(teamId)` in `teamService.ts` — no RLS/RPC changes needed, since `teams`/`team_members` are already `select`-able by any authenticated user (`teams_select_authenticated`/`team_members_select_authenticated`, `using (true)`) and `get_team_overview(p_team_id)` never checked caller membership in the first place. `TeamScreen`'s rank-badge callback renamed `onOpenTopTeams` → `onOpenLeaderboards`, now jumps to Social → Leaderboards (solo mode by default) instead of the old dedicated screen.

**Distance milestone records (best efforts):** `20260722000005_distance_records.sql` — adds 3 new achievement definitions (`one_mile`, `five_mile_run`, `ten_k`; mirrors the existing `five_k`/`half_marathon`/`marathon` `single_run_distance_miles` pattern, so all 6 milestones — 1mi/5k/5mi/10k/half/marathon — now have a "completed it" badge) plus a new `activity_distance_records` table (`activity_id`, `user_id`, `distance_key`, `split_seconds`, unique per activity+distance). Unlike the completion achievements (which key off `activities.distance_meters`), this tracks a **split time** — elapsed time from the start of the run until cumulative distance first reaches the milestone, not the whole run's duration — computed client-side via `computeDistanceMilestoneSplits()` (`src/services/activityStreams.ts`, reuses the same `interpolateAtDistance` interpolation `computeMileSplits` already used) at "Lock in your run" time (`RunScreen.handleAddToFeed` for native runs, `PendingActivityConfirmationContext.handleAddToFeed` for HealthKit-synced runs), then written via a new `upsert_distance_record` RPC. A single run can qualify for multiple milestones at once (e.g. a first-ever marathon run's split also counts as that person's mile/5k/5mi/10k/half splits). Gold/silver/bronze standing is **current, not historical** — computed live by `get_distance_badges(activity_ids)` (used for feed cards and run-detail, ranked against the activity owner's full history for that distance) and `get_personal_records(user_id)` (top-3 per distance for the Me page's new "Personal Records" section) — both `security definer` window-function queries, so a badge can disappear from an old run if a later run displaces it from the top 3, rather than being a permanent stamp. `activity_distance_records` select RLS is `using (true)` (authenticated, like `player_rank`) since badges render on other users' feed cards; insert is restricted to the caller's own activities. New `DistanceMedalRow` (`src/components/badges/`) renders the resulting badges as a row of small medal chips — plural, since one run can earn several simultaneously.

**Solo rating history (Competitive History, premium):** `20260723000003_solo_rating_history.sql` — `apply_elo_match_result_system` always computed each side's Elo delta/new rating at `finalize_solo_match`/`forfeit_solo_match` time, but only the **current** `player_rank.competitive_rating` survived — there was no way to reconstruct rating at a past point in time. New nullable `match_participants.rating_before`/`rating_after`/`rating_delta` columns, written by a new `record_match_rating_change(match_id, user_id, new_rating, delta)` helper called right after `apply_elo_match_result_system` inside both `finalize_solo_match` and `forfeit_solo_match` (both re-declared here — schema-doc rule of thumb: only the *latest* prior definition needs patching, no need to touch every historical migration that once defined them). New `get_solo_rating_history(user_id, limit)` RPC returns each completed solo match with its rating snapshot, opponent, result, and points, newest first, filtered to `rating_after is not null` (matches finalized before this migration have no history and are excluded rather than guessed at). Client: `fetchSoloRatingHistory` (`src/services/rank/ratingHistoryService.ts`); Me tab's Competitive tab gets a new `CompetitiveHistorySection` (list of latest matches, mirrors `PersonalRecordsSection`'s pattern) that opens `CompetitiveHistoryModal` — gated by the same `usePurchases().isPremium` + `PaywallScreen` pattern as `AllTimeBestsModal` (non-premium taps go straight to the paywall). Premium view is a rating-over-time line chart (`RatingHistoryChart`, one point per completed match) — tapping a point focuses that match's summary card below (opponent, result, rating before → after) with a "View Match Details" button that navigates to the existing `SoloMatchScreen` read-only detail route (`onOpenMatch` threaded through `MeScreen` → `AppShell.openSoloMatchDetail`, same as `runDetail`/`teamMatchDetail`). Both avatars (viewer + opponent, `RankBorderAvatar`, resolved via a `player_rank`/`rank_tiers` lookup per opponent) render side by side on `MatchHistoryRow` and the focused-match summary card — plain side-by-side, not overlapping (an overlapping-duo layout was tried first and looked like the avatars were stacked on top of each other). Me tab's preview list shows only the latest 3 matches (`CompetitiveHistorySection`'s `VISIBLE_COUNT`).

**Fix:** `20260723000005_solo_rating_history_recompute_points.sql` — `get_solo_rating_history` originally read `my_points`/`opponent_points` straight from `match_participants.points`, which is the same **stale-for-old-matches** column `fetchSoloMatchFeedPosts` already had to stop trusting (`20260720000003` only recomputes it at *new* finalize time, never retroactively) — every match showed the old placeholder score (e.g. `1-0`) instead of the real one (e.g. `23-10`). Re-declared to recompute both sides' points fresh via `match_side_points(match_id, user_id)` on every read and derive win/loss/tie from that, matching the feed's fix.

**Fix:** `20260723000006_fix_stale_solo_points_and_redo_backfill.sql` — the stale-points bug above wasn't just cosmetic: the `20260723000004` backfill decided win/loss/tie from the same stale `match_participants.points`, so a genuinely-decided match stored as a false `0-0` (points never recomputed for it) got misread as a tie and **skipped entirely** — excluded from history, not just mis-scored. Fixed at the source: recompute and overwrite every completed solo match's `points` via `match_side_points()` first, then redo the full deterministic Elo-replay backfill from a clean slate (reset `rating_before`/`rating_after`/`rating_delta` to null, replay again) so nothing already-backfilled is left inconsistent with a newly-corrected match.

**Fix:** `20260723000007_include_ties_in_rating_history.sql` — a tie correctly never calls `apply_elo_match_result_system` (a tie shouldn't move Elo), but that also meant it never got a rating snapshot at all, so `get_solo_rating_history` dropped every tie from history — the user wanted ties visible as a flat (zero-delta) point on the graph, not absent. `finalize_solo_match`'s tie branch now calls `record_match_rating_change` with each side's **current** `player_rank.competitive_rating` and `delta = 0`; the backfill was redone once more (same reset-and-replay pattern) folding ties into the same chronological loop so the running rating carries forward unchanged through them instead of skipping them.

**UGC safety compliance (App Store Guideline 1.2):** `20260730000001_terms_acceptance.sql` — `profiles.terms_accepted_at`, `accept_terms()` RPC; new `OnboardingTermsScreen` gates every user (new signups and pre-existing accounts alike) before they can reach the app shell (`RootNavigator.tsx` checks `gameState.profile.terms_accepted_at` directly, independent of the normal onboarding-step machinery, so pre-existing accounts are re-gated on next launch too). `20260730000002_content_moderation.sql` — new `content_reports` (open/actioned/dismissed queue, self-insert/select-only RLS) and `blocked_users` (composite PK, self-managed RLS) tables; `report_content`/`block_user`/`unblock_user`/`fetch_blocked_user_ids` RPCs; `is_blocked_either_way(a, b)` helper plumbed into a third redeclaration of `can_view_feed_post` (prior: `20250618000001`, `20250621000001`) plus the `feed_posts_select_community`/`_team`/`_friends` policies (drop+recreate, since those don't route through `can_view_feed_post`) — a block is enforced server-side via RLS, not just client-side, and hides the blocked relationship's content bidirectionally. Match-result feed posts (`_team_match`/`_solo_match` select policies) are intentionally out of scope — structured match records, not the free-text UGC surface in question; their comments are still covered since comments use the same `can_view_feed_post` gate regardless of post kind. A trigger on `content_reports` insert writes a `notification_events` row (new `content_report` category, added to that table's existing check constraint) targeted at the developer's own account (looked up by email in `auth.users`) — reuses the existing `deliver-notifications` push pipeline rather than adding a new email provider. Client: `moderationService.ts`, `BlockedUsersContext` (client-side optimistic filtering layered on top of the RLS filter, for instant removal without waiting on a refetch), `ReportMenu` (shared action-sheet, wired into `RunCard`/`FeedCommentsDrawer`), `BlockedUsersScreen` (Settings → Safety). `20260730000003_content_filter.sql` — `blocked_terms` table (plain data, editable via Studio without a redeploy, not a hardcoded list) + `contains_blocked_terms()` + `before insert or update` triggers on `feed_posts`/`feed_comments`/`match_messages` that raise `CONTENT_REJECTED: ...` (insert fails outright, not silently stripped) — client-side `contentFilterError.ts` rewrites that into a friendly message, surfaced through each surface's existing error-display path (no UI changes needed — `FeedCommentsDrawer`/`useMatchChat`/`RunScreen` already rendered `.message` from a thrown `Error`). The 24h developer-response commitment itself is a process obligation, not something this schema can enforce — reports are always fully queryable in `content_reports` via Studio regardless of whether the push notification lands.

Storage buckets: `activities` (private tracks), `avatars` (public profile photos), `run-photos` (public run photo attachments).

Full detail: [02-supabase-backend.md](../milestones/02-supabase-backend.md).

---

## RLS helpers (security definer)

| Function | Used by |
|----------|---------|
| `is_match_participant`, `can_view_match` | `matches` / `match_participants` SELECT |
| `user_owns_activity` | `feed_posts` INSERT |
| `activity_has_visible_feed_post` | `activities` SELECT (feed-shared) |
| `can_view_feed_post` | `feed_reactions` / `feed_comments` SELECT + INSERT |
| `apply_elo_match_result` | Elo rating + season W/L updates on `player_rank` (participants only) |
| `add_friend` | Bidirectional friendship rows for friends feed + `add_friend` achievement |
| `delete_own_account` | Permanently delete `auth.users` row for current user (cascades app data) |
| `enqueue_solo_matchmaking` | Join solo queue; pair by competitive rating band |
| `cancel_solo_matchmaking` | Leave solo queue while waiting |
| `get_solo_matchmaking_status` | Queue / active-match state for current user |
| `credit_match_activity` | Award match points for a synced run (idempotent) |
| `finalize_solo_match` | Complete due solo match and apply Elo |
| `forfeit_solo_match` | End active solo match early; forfeiter loses, opponent wins |
| `get_my_solo_match_completions` | Fetch persisted completion payloads for result drawer |
| `send_solo_match_challenge` | Challenge a friend to 1v1 (must be mutual friends) |
| `accept_solo_match_challenge` | Accept challenge → creates active solo match |
| `decline_solo_match_challenge` / `cancel_solo_match_challenge` | Reject or withdraw pending challenge |
| `get_solo_match_challenge_status` | Sent + received pending challenges for Solo tab |
| `has_incoming_solo_match_challenge` | Boolean for Match/Solo tab indicators |
| `evaluate_achievements` | Check + grant eligible achievement unlocks + XP |
| `record_achievement_event` | One-time client events (share, review, follow, notifications) |
| `assert_feature_gate` | Raise “Reach level N to unlock X” when below an active `feature_gates` threshold (via `level_from_total_xp`); called by BEFORE triggers on `match_queue`, `solo_match_challenges`, `feed_comments` |
| `create_team` | Level-gated (L10) team create; leader membership in same transaction |
| `update_team` / `promote_member` / `demote_member` / `kick_member` / `transfer_leadership` / `disband_team` | Role-checked team management (writes to `teams` / `team_members` roles go through these only) |
| `get_team_overview` | Real Team tab aggregates: rating, rank position, season W/L, 7-day + lifetime team miles, per-member 7-day miles |
| `list_top_teams` | Top-teams listing ordered by `team_rank.competitive_rating` with member count + combined member XP |
| `apply_team_elo_match_result_system` | Team Elo + season W/L on `team_rank` (system-only; team match finalize) |
| `enqueue_team_matchmaking` / `cancel_team_matchmaking` / `get_team_matchmaking_status` | Team matchmaking queue (leader/co-leader only; min roster 2; pairs by rating band) |
| `invite_to_team` / `request_to_join_team` / `respond_to_team_invite` / `respond_to_join_request` / `cancel_team_membership_request` | Team invites + join requests; accept joins via `team_members` |
| `finalize_team_match` | System-only: scores + completes a due team match (top-5 point-earners per side, Elo, persisted completion) |
| `finalize_due_team_matches_for_user` / `get_my_team_match_completions` | Client-facing team match finalize/fetch pair (mirror the solo pair) |
| `get_team_notifications` / `has_team_notifications` | Pending invites/requests relevant to the caller (feed bell + indicators) |
| `delete_activity` | Delete caller's own activity; `feed_posts` + `match_activity_credits` cascade (run detail screen, milestone 08) |

---

## Shipped tables (detail)

| Table | Notes |
|-------|--------|
| `profiles` | `team_id` denormalized from `team_members` (trigger) |
| `activities` | Summary + `polyline` jsonb; RLS includes feed-shared read |
| `teams` | Seeded `Road Warriors` (`11111111-1111-4111-8111-111111111111`) |
| `team_members` | Unique `user_id` — one team per user (v1) |
| `feed_posts` | `audiences text[]`: `community`, `friends`, `team`; unique `activity_id`; OR unique `match_id` for team-match result posts (visibility governed by a dedicated policy, not `audiences`) |
| `matches` | `kind` team/solo, `state_json` UI shell, `ends_at` for countdown |
| `match_participants` | `user_id`, `side`, `points`; solo enroll on first view |
| `solo_match_challenges` | Pending friend 1v1 invites; `status` pending/accepted/declined/cancelled/expired |
| `xp_ledger` | Per-award audit trail; idempotent run awards via partial unique index |
| `player_progress` | `total_xp`, `streak_days`, `last_award_date`, `rolling_avg_pace_sec` |
| `feature_gates` | Level-gate catalog (seeded): `feed_comments` L2, `send_friend_challenge` L3, `ranked_solo_queue` L5, `create_team` L10 (`is_active = false` until built) |

---

- Duplicating `rank_tiers` (or enums) in `src/config/*.ts` **and** DB — pick DB + generated types.
- Storing catalog display strings on `profiles` or `player_rank`.
- Writing queries from memory without checking `database.ts`.
- Committing app code that references columns not in latest migration.

---

## Commands (reference)

```bash
# Local types (after migrations exist)
supabase gen types typescript --local > src/types/database.ts

# Linked remote project
supabase gen types typescript --project-id <ref> > src/types/database.ts
```
