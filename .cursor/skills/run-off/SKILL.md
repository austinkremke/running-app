---
name: run-off
description: >-
  Architecture, patterns, and risks for Run Off (running-app). Use when working
  in this repo on runs, activities, maps, Supabase, XP, rank, matches, feed,
  milestones, or any feature that touches progression or backend sync.
---

# Run Off — Architecture & Consistency

**Repo:** `running-app` (Run Off) · **Roadmap:** [milestones/README.md](../../milestones/README.md)

Read milestone docs before large features. Update milestone status/deps when scope shifts.

---

## Milestone order (do not skip blindly)

| # | Topic | Status |
|---|--------|--------|
| 01 | Activity recording (local) | Done |
| 02 | Supabase backend | **Next** — Phase A: auth + users in DB |
| 03 | XP & rank (separate systems) | Planned |
| 04 | Garmin / Strava | Planned |
| 05 | Matchmaking & feed | Planned |

---

## Core architectural rules

### 1. `ActivityRecord` is the source of truth

- Every run/import path lands on `ActivityRecord[]` with **cumulative `distanceMeters`** per sample.
- `GpsPoint[]` and map polylines are **derived** (`recordsToGpsPoints`), not stored as the canonical model.
- Do not invent a parallel activity shape for Garmin, Strava, or Supabase — map into records.

### 2. Separate storage, metrics, and presentation

```
records (store) → metrics (distance, pace, elevation) → streams/charts (display grid)
```

- Chart x-axis and chart data share **`buildDistanceGrid`** (`src/utils/chartAxis.ts`).
- Never bucket at a fixed mile interval that does not match the axis grid.
- Post-run `PostRunSummary` is **derived** on stop, not the source of truth.

### 3. Level (XP) ≠ Rank (competitive)

| | Level / XP | Rank |
|---|------------|------|
| Driver | Runs, streaks, achievements | Match wins/losses |
| Direction | Never decreases | Can go down |
| Matchmaking | **Ignore level** | Use `competitiveRating` |
| UI | `ExperienceCard`, `XpGainDrawer` | `ProfileTopSection` RANK block |

Never derive rank from level or level from rank. See [03-xp-and-ranking.md](../../milestones/03-xp-and-ranking.md).

### 4. Layering (follow existing layout)

| Layer | Path | Responsibility |
|-------|------|----------------|
| Types | `src/types/` | `ActivityRecord`, session, progression (later) |
| Services | `src/services/` | Pure logic: recorder, metrics, streams, XP calc |
| Storage | `src/storage/` | AsyncStorage; later sync queue → Supabase |
| Context | `src/context/` | `RunProvider`, auth/progression (later) |
| Maps | `src/maps/` | Swappable providers; registry pattern |
| UI | `src/components/`, `src/screens/` | Presentation only |

Business logic does not live in screen components.

### 5. Local-first, sync later

- Record and persist on device first (`activityStorage.ts`).
- Backend (02): upload summaries + polyline in Postgres; bulky tracks/FIT in **Storage**.
- Design for offline queue + idempotent `activity_id`; server wins on conflict for validated summaries.

### 6. Supabase shape (when implementing 02)

**Start with Phase A:** Auth sign-up → `auth.users` → DB trigger → `profiles` + `player_progress` + `player_rank`. No activity sync until a real session works.

- Postgres: users, teams, matches, feed, `activities` **summary**, progression tables.
- **User provisioning:** `handle_new_user` trigger on `auth.users` INSERT — not client-side profile creation.
- **Reference catalogs in DB** (`rank_tiers`, `match_types`, …) with seeds + FKs — **do not duplicate** in `src/config/*.ts`.
- **User rows store numbers** (`competitive_rating`, `total_xp`) — not rank/level display strings.
- Storage: full record blobs, FIT/GPX, photos.
- Edge Functions: OAuth, webhooks, XP award — keep thin; queue heavy FIT parsing.
- RLS on all user/team-scoped tables from day one.

Phase A detail: [02-supabase-backend.md](../../milestones/02-supabase-backend.md#phase-a--auth--user-provisioning-first-step).

### 7. Schema workflow (DB + AI)

Before any Supabase/SQL work:

1. Read `supabase/migrations/` and `src/types/database.ts` (generated).
2. Read `supabase/SCHEMA.md` for table index.
3. After schema changes: migrate → `supabase gen types typescript --local > src/types/database.ts` → commit migration + types together.
4. Do **not** hand-write table interfaces that duplicate generated types.
5. Do **not** add `const RANK_TIERS = [...]` in app code if `rank_tiers` exists in DB.

Full workflow: [02-supabase-backend.md](../../milestones/02-supabase-backend.md#schema-workflow-ai--humans).

---

## Patterns to use

- **Registry** for map/location (`src/maps/registry.ts`) — do not hardcode Mapbox in screens.
- **`activityExchange.ts`** for import/export boundaries (FIT, Strava, GPX).
- **Dev-only mocks** behind `__DEV__` (e.g. `PostRunTestButton`, `XpGainTestButtons`).
- **Milestone headers** when adding docs: `Milestone / Status / Depends on / Unblocks`.
- **Haversine + cumulative distance** for path length; prefer imported device distance on FIT/Strava ingest.

---

## Anti-patterns (avoid)

- Storing only `GpsPoint[]` without `distanceMeters` on each sample.
- Fixed chart buckets (e.g. 0.025 mi) decoupled from x-axis grid.
- Putting raw 1 Hz GPS rows in hot Postgres tables without retention.
- Client-only XP/rank for anything that affects matches or leaderboards (post-02).
- Coupling matchmaking to player level.
- **Duplicating DB catalogs** (`rank_tiers`, match types) as hardcoded TS arrays.
- **Storing rank/level display strings** on user/profile rows.
- **Hand-written DB types** instead of generated `src/types/database.ts`.
- Editing `database.ts` by hand (always regenerate).
- Expo Router — this app uses **custom navigation** (`src/navigation/`).
- Scope creep: unrelated refactors in the same PR as a focused fix.

---

## Pre-ship checklist (feature-dependent)

Before merging significant work, confirm relevant items:

- [ ] Uses `ActivityRecord` model (or maps into it at the boundary)
- [ ] Charts/maps use derived data, not a second timeline
- [ ] XP changes do not touch rank; rank changes do not touch XP
- [ ] Milestone order respected (or milestone README updated)
- [ ] **DB work:** read `supabase/migrations/` + `src/types/database.ts`; regen types if schema changed
- [ ] **Catalogs:** reference data from DB, not duplicated config lists
- [ ] **Auth (02 Phase A):** sign-up provisions `profiles` via trigger; no client-only profile insert
- [ ] Native modules (AsyncStorage, Mapbox) noted if rebuild required
- [ ] Permissions: location is foreground-only unless milestone says otherwise
- [ ] No secrets in git; use `EXPO_PUBLIC_*` only for non-sensitive config

Full risk catalog: [reference.md](reference.md)

---

## Stack reminders

- **Expo 56** — read https://docs.expo.dev/versions/v56.0.0/ before platform APIs.
- **Mapbox** — dev client build required; not Expo Go.
- **Env:** `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, `EXPO_PUBLIC_MOCK_GPS` (0 on device).
- **Supabase** — not wired yet; Phase A: auth + trigger-provisioned profiles ([02](../../milestones/02-supabase-backend.md#phase-a--auth--user-provisioning-first-step)).

---

## Key files (quick map)

| Area | Files |
|------|--------|
| Recording | `RunContext.tsx`, `activityRecorder.ts`, `activityStorage.ts` |
| Types | `types/activity.ts` |
| Charts | `activityStreams.ts`, `chartAxis.ts` |
| Post-run | `PostRunScreen.tsx`, `buildPostRunSummary.ts` |
| Maps | `MapboxMapView.tsx`, `locationProvider.ts` |
| Onboarding (mock auth) | `OnboardingContext.tsx`, `OnboardingLoginScreen.tsx` → replace with `AuthContext` (02 Phase A) |
| XP UI (mock) | `XpGainDrawer.tsx`, `mock/xpGain.ts` |
| Auth (planned) | `AuthContext.tsx`, `services/supabase.ts` (02 Phase A) |
| Milestones | `milestones/*.md` |
| Supabase schema | `supabase/migrations/`, `supabase/SCHEMA.md`, `src/types/database.ts` |

---

## When adding a new milestone

1. Create `milestones/NN-slug.md` with standard header.
2. Update [milestones/README.md](../../milestones/README.md) table + dependency diagram.
3. Add a row to this skill’s milestone table if the roadmap changes.
4. Add any new **hard rules** to [reference.md](reference.md) if they are cross-cutting.
