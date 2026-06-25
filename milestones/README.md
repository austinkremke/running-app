# Milestones

Chronological roadmap for **Run Off** (`running-app`). Each milestone is a self-contained design doc. **Living documents** — subject to change.

**Consistency across tasks:** follow [.cursor/skills/run-off/SKILL.md](../.cursor/skills/run-off/SKILL.md) (architecture + checklist) and [reference.md](../.cursor/skills/run-off/reference.md) (risks). `AGENTS.md` points here.

**Database / schema:** [supabase/SCHEMA.md](../supabase/SCHEMA.md) — migration workflow, DB-first catalogs (`rank_tiers`), generated `src/types/database.ts`.

**Backend order (milestone 02):** Auth → activity sync → teams/feed → matches. Phases A–D are **shipped**; Phase E (hardening) is **next**. See [02](./02-supabase-backend.md).

**When shipping work:** update docs before commit — checklist in [run-off SKILL § Docs sync](../.cursor/skills/run-off/SKILL.md#docs-sync-on-ship-required).

When adding a milestone:

1. Pick the next `NN-slug.md` number (insert/reorder if something must land earlier).
2. Add a row to the table below with **status**, **depends on**, and **unblocks**.
3. Update dependency links in affected milestones so the chain stays consistent.

---

## Roadmap (in order)

| # | Milestone | Status | Depends on | Unblocks |
|---|-----------|--------|------------|----------|
| 01 | [Activity recording](./01-activity-recording.md) | **Done** | — | 02, 03, 04 |
| 02 | [Supabase backend](./02-supabase-backend.md) | **In progress** — Phase A–D done; Phase E hardening next | 01 | 03, 04, 05 |
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
        │  Phase C: teams + feed     │
        │  Phase D: matches          │
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

---

## When shipping a phase (docs sync)

Do **not** commit feature work without updating docs. Required files and steps: [run-off SKILL — Docs sync on ship](../.cursor/skills/run-off/SKILL.md#docs-sync-on-ship-required).

Minimum: this table, `README.md`, `milestones/02-supabase-backend.md` (if backend), `supabase/SCHEMA.md` (if schema), `AGENTS.md`, and the skill milestone table.
