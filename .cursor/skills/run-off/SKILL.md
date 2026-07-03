---
name: run-off
description: >-
  Architecture, patterns, and risks for Run Off (running-app). Use when working
  in this repo on runs, activities, maps, Supabase, XP, rank, matches, feed,
  milestones, or any feature that touches progression or backend sync.
---

# Run Off — Architecture & Consistency

**Repo:** `running-app` (Run Off) · **Roadmap:** [milestones/README.md](../../milestones/README.md)

Read milestone docs before large features. **Update all docs when shipping a phase** — see [Docs sync on ship](#docs-sync-on-ship-required).

---

## Docs sync on ship (required)

When you finish a **milestone**, **milestone 02 phase**, or any PR that changes backend scope or roadmap status, update documentation **in the same commit** before push. Do not leave READMEs stale.

### Checklist (touch every row that applies)

| File | What to update |
|------|----------------|
| [README.md](../../README.md) | Status table, stack, backend flows, “still mock” table, key services |
| [milestones/README.md](../../milestones/README.md) | Roadmap table, dependency diagram, phase notes |
| [milestones/02-supabase-backend.md](../../milestones/02-supabase-backend.md) | Phase status header, phase checklists, app integration table, “current step” |
| [milestones/01-activity-recording.md](../../milestones/01-activity-recording.md) | Known gaps / handoff if sync or feed behavior changed |
| [milestones/03-xp-and-ranking.md](../../milestones/03-xp-and-ranking.md) | Phase status, formula reference, test command |
| [milestones/05-matchmaking-and-feed.md](../../milestones/05-matchmaking-and-feed.md) | Scope “Today vs Target” if feed/teams/matches moved |
| [milestones/06-account-gating-and-cosmetics.md](../../milestones/06-account-gating-and-cosmetics.md) | If account/gating/achievement scope changed |
| [supabase/SCHEMA.md](../../supabase/SCHEMA.md) | Table index, “Phase X ships” lines, workflow step 6 |
| [AGENTS.md](../../AGENTS.md) | Quick rules, current phase pointer |
| [SKILL.md](SKILL.md) | Milestone table, Supabase phases, key files, pre-ship checklist |
| [reference.md](reference.md) | New cross-cutting risks only |
| [.cursor/rules/run-off.mdc](../../.cursor/rules/run-off.mdc) | One-line backend status if it changed |

### Also when schema changed

1. New migration in `supabase/migrations/`
2. Rollback script in `supabase/rollbacks/<timestamp>_<slug>.down.sql`
3. `supabase db push` (remote) or `supabase db reset` (local) — **agents run this, don't leave it to the user**
4. `supabase gen types typescript --linked > src/types/database.ts` (or `--local` after local reset)
5. Seed/reference data in `seed.sql` if needed

### Commit message hint

Mention milestone/phase in the subject (e.g. `milestone 02 Phase C`) and note doc updates in the body.

---

## Milestone order (do not skip blindly)

| # | Topic | Status |
|---|--------|--------|
| 01 | Activity recording (local) | Done |
| 02 | Supabase backend | **In progress** — Phase A–D done; Phase E next |
| 03 | XP & rank (separate systems) | **In progress** — Phase 1–2 + 4 shipped; Phase 3 solo Elo via 05; Phase 5 achievements via 06 |
| 04 | Garmin / Strava | Planned |
| 05 | Matchmaking & feed | **Done** — Phase 1–6 shipped |
| 06 | Account settings, achievements, rank avatar borders, level & paywall gates | **In progress** — Phase 1–4 shipped; Phase 5 paywall next |
| 07 | Team play — creation, management, team matchmaking | **Next** — design decided (top-N scoring, team Elo, leader queue rights, create at L10) |

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
| Storage | `src/storage/` | AsyncStorage, activity sync queue → Supabase |
| Context | `src/context/` | `RunProvider`, `AuthProvider` |
| Maps | `src/maps/` | Swappable providers; registry pattern |
| UI | `src/components/`, `src/screens/` | Presentation only |

Business logic does not live in screen components.

### 5. Local-first, sync on stop

- Record and persist on device first (`activityStorage.ts`).
- On run stop: sync summary + polyline to Postgres; full track to Storage (`activitySync.ts`).
- Offline or logged-out runs queue locally; flush on login (`activitySyncQueue.ts`).

### 6. Supabase shape

**Phase A (done):** Auth sign-up → `auth.users` → DB trigger → `profiles` + `player_progress` + `player_rank`.

**Phase B (done):** `activities` table + Storage bucket; sync on run stop.

**Phase D (done):** `matches`, `match_participants`, active match screens; `match_id` on activities.

**Phase E (next):** Edge Functions, webhooks, hardening.

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
- [ ] **Activity sync (02 Phase B):** run stop uploads `activities` row + Storage track when logged in
- [ ] **Social (02 Phase C):** feed/team screens use `feedService` / `teamService`; feed cards render route from `polyline`
- [ ] **Feed engagement (05 Phase 1):** likes/comments via `feedEngagementService`; optimistic toggle + comments drawer
- [ ] **Rank (05 Phase 2):** Me tab + solo match from `player_rank` + `rank_tiers`; Elo via `apply_elo_match_result` RPC only
- [ ] **Matches (02 Phase D):** active team/solo screens from `matchService`; `match_id` on synced activities
- [ ] **Solo matchmaking (05 Phase 4):** `enqueue_solo_matchmaking` queue; `credit_match_activity`; `finalize_solo_match` → Elo
- [ ] **Solo realtime (05 Phase 5):** `useMatchRealtimeRefresh`; `match_messages` chat; live countdown
- [ ] **Solo completion (05 Phase 6):** `SoloMatchCompletionProvider` + `get_my_solo_match_completions`; do not block navigation on `syncCompletions`
- [ ] **Friend challenges (05 Phase 6):** `challengeService` + `solo_match_challenges` RPCs; indicators via `useMatchTabIndicators`
- [ ] **Forfeit (05 Phase 6):** `forfeit_solo_match` RPC; quitter = loss, opponent = win
- [ ] **Level gates (06 Phase 4):** thresholds from `feature_gates` catalog, never TS constants; locked UI via `useFeatureGate` (fail-open); server triggers authoritative; level-curve changes must update SQL `level_from_total_xp` + parity fixtures
- [ ] **Progression (03):** `award_run_xp` RPC on lock-in; local cache sync; `npm test` passes after XP formula changes
- [ ] **Docs sync:** README, milestones, SCHEMA, AGENTS, skill updated for shipped scope
- [ ] Permissions: location is foreground-only unless milestone says otherwise
- [ ] No secrets in git; use `EXPO_PUBLIC_*` only for non-sensitive config

Full risk catalog: [reference.md](reference.md)

---

## Stack reminders

- **Expo 56** — read https://docs.expo.dev/versions/v56.0.0/ before platform APIs.
- **Mapbox** — dev client build required; not Expo Go.
- **Env:** `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, `EXPO_PUBLIC_MOCK_GPS` (0 on device).
- **Supabase** — Phases A–D live. `supabase db push` after migrations.

---

## Key files (quick map)

| Area | Files |
|------|--------|
| Recording | `RunContext.tsx`, `activityRecorder.ts`, `activityStorage.ts`, `activitySync.ts` |
| Types | `types/activity.ts` |
| Charts | `activityStreams.ts`, `chartAxis.ts` |
| Post-run | `PostRunScreen.tsx`, `buildPostRunSummary.ts` |
| Maps | `MapboxMapView.tsx`, `StaticRouteMapPreview.tsx`, `locationProvider.ts` |
| Onboarding / auth | `AuthContext.tsx`, `OnboardingContext.tsx`, `OnboardingLoginScreen.tsx` |
| XP UI | `XpGainDrawer.tsx`, `PlayerProgressContext.tsx`, `services/progression/*` |
| Auth + sync | `AuthContext.tsx`, `services/supabase.ts`, `activitySync.ts`, `activitySyncQueue.ts` |
| Social | `feedService.ts`, `feedEngagementService.ts`, `rankService.ts`, `teamService.ts`, `socialMappers.ts`, `FeedCommentsDrawer.tsx`, `activityAdapters.ts` (`polylineToGpsPoints`) |
| Matches | `matchService.ts`, `matchmakingService.ts`, `challengeService.ts`, `matchMappers.ts`, `useActiveTeamMatch.ts`, `useActiveSoloMatch.ts`, `useSoloMatchmaking.ts`, `useSoloMatchChallenges.ts`, `SoloMatchCompletionContext.tsx`, `InAppNotificationContext.tsx` |
| Progression | `PlayerProgressContext.tsx`, `services/progression/*`, `progressionStorage.ts`, `config/xpRewards.ts` |
| Feature gates | `featureGateService.ts`, `useFeatureGate.ts`, `levelCurve.ts` (+ SQL mirror in `20250620000001_achievements.sql`) |
| Tests | `npm test`, `src/services/progression/__tests__/` |
| Milestones | `milestones/*.md` |
| Supabase schema | `supabase/migrations/`, `supabase/SCHEMA.md`, `src/types/database.ts` |

---

## When adding a new milestone

1. Create `milestones/NN-slug.md` with standard header.
2. Update [milestones/README.md](../../milestones/README.md) table + dependency diagram.
3. Add a row to this skill’s milestone table if the roadmap changes.
4. Add any new **hard rules** to [reference.md](reference.md) if they are cross-cutting.
5. Run [Docs sync on ship](#docs-sync-on-ship-required) checklist.
