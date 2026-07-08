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
                              — source, summary_json, polyline (jsonb), track_storage_path
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

Storage buckets: `activities` (private tracks), `avatars` (public profile photos).

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
