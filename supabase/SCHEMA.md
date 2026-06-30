# Database schema overview

> **Source of truth:** `supabase/migrations/*.sql`.  
> **Generated types:** `src/types/database.ts` via `supabase gen types typescript`.  
> **Design doc:** [milestones/02-supabase-backend.md](../milestones/02-supabase-backend.md)

This file is a **human/AI-readable index**. After every migration, update the table list below and regenerate types.

---

## Schema workflow (required)

1. **Change schema** → add SQL file under `supabase/migrations/`.
2. **Apply locally** → `supabase db reset` or `supabase migration up`.
3. **Regenerate types** → `supabase gen types typescript --local > src/types/database.ts`.
4. **Commit together** → migration + `database.ts` (+ `seed.sql` if reference data changed).
5. **Update this file** if tables or FK relationships changed.
6. **Docs sync** — run [run-off SKILL checklist](../.cursor/skills/run-off/SKILL.md#docs-sync-on-ship-required): README, milestones, AGENTS, skill.

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

teams / team_members            — logo, tag, motto; one team per user (v1)
feed_posts                      — activity_id FK, audiences[], caption fields

matches / match_participants / match_results
match_types                     — reference catalog (seed)
feed_reactions                  — post_id, user_id, reaction (like); PK (post_id, user_id)
feed_comments                   — post_id, user_id, body, created_at
```

**Phase A ships:** `profiles`, `player_progress`, `player_rank`, trigger, RLS, `rank_tiers` seed.  
**Phase B ships:** `activities` table + `activities` Storage bucket; sync on run stop.  
**Phase C ships:** `teams`, `team_members`, `feed_posts`, `profiles.team_id`; feed + team UI from server; feed route preview from `activities.polyline`.  
**Phase D ships:** `match_types`, `matches`, `match_participants`; active match screens + `activities.match_id`.  
**Phase 4 ships:** `xp_ledger`, `award_run_xp` / `bootstrap_progression_from_local` RPCs, progression columns on `player_progress`, social read-all RLS for levels on feed.  
**05 Phase 1 ships:** `feed_reactions`, `feed_comments`, `can_view_feed_post` RLS helper; engagement counts aggregated in feed fetch.

**Post–Phase D RLS fixes:** `20250615000001_fix_match_participants_rls.sql`, `20250616000001_fix_feed_posts_rls.sql` — security definer helpers to avoid policy recursion.  
**05 Phase 1:** `20250618000001_feed_likes_comments.sql`.

Full detail: [02-supabase-backend.md](../milestones/02-supabase-backend.md).

---

## RLS helpers (security definer)

| Function | Used by |
|----------|---------|
| `is_match_participant`, `can_view_match` | `matches` / `match_participants` SELECT |
| `user_owns_activity` | `feed_posts` INSERT |
| `activity_has_visible_feed_post` | `activities` SELECT (feed-shared) |
| `can_view_feed_post` | `feed_reactions` / `feed_comments` SELECT + INSERT |

---

## Shipped tables (detail)

| Table | Notes |
|-------|--------|
| `profiles` | `team_id` denormalized from `team_members` (trigger) |
| `activities` | Summary + `polyline` jsonb; RLS includes feed-shared read |
| `teams` | Seeded `Road Warriors` (`11111111-1111-4111-8111-111111111111`) |
| `team_members` | Unique `user_id` — one team per user (v1) |
| `feed_posts` | `audiences text[]`: `community`, `friends`, `team`; unique `activity_id` |
| `matches` | `kind` team/solo, `state_json` UI shell, `ends_at` for countdown |
| `match_participants` | `user_id`, `side`, `points`; solo enroll on first view |
| `xp_ledger` | Per-award audit trail; idempotent run awards via partial unique index |
| `player_progress` | `total_xp`, `streak_days`, `last_award_date`, `rolling_avg_pace_sec` |

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
