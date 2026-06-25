# Milestones

Chronological roadmap for **Run Off** (`running-app`). Each milestone is a self-contained design doc. **Living documents** — subject to change.

**Consistency across tasks:** follow [.cursor/skills/run-off/SKILL.md](../.cursor/skills/run-off/SKILL.md) (architecture + checklist) and [reference.md](../.cursor/skills/run-off/reference.md) (risks). `AGENTS.md` points here.

**Database / schema:** [supabase/SCHEMA.md](../supabase/SCHEMA.md) — migration workflow, DB-first catalogs (`rank_tiers`), generated `src/types/database.ts`.

**Backend order (milestone 02):** Auth sign-up → `auth.users` → trigger → `profiles` + progression rows → then activity sync. See [02 Phase A](./02-supabase-backend.md#phase-a--auth--user-provisioning-first-step).

When adding a milestone:

1. Pick the next `NN-slug.md` number (insert/reorder if something must land earlier).
2. Add a row to the table below with **status**, **depends on**, and **unblocks**.
3. Update dependency links in affected milestones so the chain stays consistent.

---

## Roadmap (in order)

| # | Milestone | Status | Depends on | Unblocks |
|---|-----------|--------|------------|----------|
| 01 | [Activity recording](./01-activity-recording.md) | **Done** | — | 02, 03, 04 |
| 02 | [Supabase backend](./02-supabase-backend.md) | **In progress** — Phase A + B done; Phase C teams/feed next | 01 | 03, 04, 05 |
| 03 | [XP & competitive rank](./03-xp-and-ranking.md) | Planned | 01, 02 (partial) | 05 |
| 04 | [Third-party integrations](./04-third-party-integrations.md) | Planned | 01, 02 | 05 |
| 05 | [Matchmaking, feed & social sync](./05-matchmaking-and-feed.md) | Planned | 02, 03, 04 | — |

---

## Dependency flow

```
01 Activity recording (local)
        │
        ▼
02 Supabase backend ─────────────────┐
        │  Phase A: auth + profiles  │
        │  Phase B: activity sync    │
        ├──────────────┬─────────────┤
        ▼              ▼             ▼
03 XP & rank    04 Garmin/Strava   (auth, teams schema)
        │              │
        └──────┬───────┘
               ▼
05 Matchmaking & feed sync
```

---

## Status legend

| Status | Meaning |
|--------|---------|
| **Done** | Shipped in app (may still be polished later). |
| **Next** | Agreed direction; ready to implement when prioritized. |
| **Planned** | Designed or stubbed; not started. |
| **Deferred** | Explicitly out of scope for now. |

---

## What we’re not tracking here

- UI polish, map UX, onboarding tweaks (ship continuously).
- App Store / RevenueCat / paywall (track separately if needed).
- Native build / Xcode / Mapbox ops (README or project docs).

---

## Adding milestone `06+` (template)

Create `milestones/06-your-slug.md` with this header:

```markdown
# Title

> **Milestone:** 06  
> **Status:** Planned  
> **Depends on:** 02, …  
> **Unblocks:** …

## Goal
…

## Rollout phases
…
```

Then update this README table and any milestones whose dependencies changed.
