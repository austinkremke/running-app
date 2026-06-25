# Database schema overview

> **Source of truth:** `supabase/migrations/*.sql` (add when milestone 02 starts).  
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

activities                    — id, user_id, started_at, distance_m, summary_json, polyline, …
teams / team_members
matches / match_participants / match_results
feed_posts / feed_reactions
```

**Phase A ships:** `profiles`, `player_progress`, `player_rank`, trigger, RLS, `rank_tiers` seed.  
**Phase B+:** `activities`, teams, matches, feed.

Full detail: [02-supabase-backend.md](../milestones/02-supabase-backend.md).

---

## Anti-patterns

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
