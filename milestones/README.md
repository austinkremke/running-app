# Milestones

Chronological roadmap for **Run Off** (`running-app`). Each milestone is a self-contained design doc. **Living documents** — subject to change.

**Consistency across tasks:** follow [.cursor/skills/run-off/SKILL.md](../.cursor/skills/run-off/SKILL.md) (architecture + checklist) and [reference.md](../.cursor/skills/run-off/reference.md) (risks). `AGENTS.md` points here.

**Database / schema:** [supabase/SCHEMA.md](../supabase/SCHEMA.md) — migration workflow, DB-first catalogs (`rank_tiers`), generated `src/types/database.ts`.

**Backend order (milestone 02):** Auth → activity sync → teams/feed → matches. Phases A–D are **shipped**; Phase E (hardening) is **next**. See [02](./02-supabase-backend.md).

**Product priority (next feature):** [05 Phase 3 — Friends feed & richer cards](./05-matchmaking-and-feed.md#phase-3--friends-feed--richer-cards-next) or [02 Phase E — hardening](./02-supabase-backend.md).

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
| 02 | [Supabase backend](./02-supabase-backend.md) | **In progress** — Phase A–D done; Phase E hardening next | 01 | 03, 04, 05, 06 |
| 03 | [XP & competitive rank](./03-xp-and-ranking.md) | **In progress** — Phase 1–2 + Phase 4 server XP shipped | 01, 02 (partial) | 05, 06 |
| 04 | [Third-party integrations](./04-third-party-integrations.md) | Planned | 01, 02 | 05 |
| 05 | [Matchmaking, feed & social sync](./05-matchmaking-and-feed.md) | **In progress** — Phase 1–2 shipped | 02 (Phase C+) | — |
| 06 | [Account, gating & cosmetics](./06-account-gating-and-cosmetics.md) | Planned | 02, 03 | — |

---

## Also on the roadmap (milestone 06)

| Item | Milestone |
|------|-----------|
| Feed likes & comments | [05](./05-matchmaking-and-feed.md) Phase 1 **shipped** |
| Elo & rank UI (Me tab, solo match) | [05](./05-matchmaking-and-feed.md) Phase 2 **shipped** |
| Account settings | [06](./06-account-gating-and-cosmetics.md) Phase 1 |
| Achievements (server-backed) | [06](./06-account-gating-and-cosmetics.md) Phase 2 · XP source in [03](./03-xp-and-ranking.md) · **catalog defined** |
| Avatar rank decorative borders | [06](./06-account-gating-and-cosmetics.md) Phase 3 · tiers in [03](./03-xp-and-ranking.md) |
| Level blocking features | [06](./06-account-gating-and-cosmetics.md) Phase 4 |
| Paywall blocking features | [06](./06-account-gating-and-cosmetics.md) Phase 5 |

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
        │
        ▼
06 Account settings · achievements · rank avatar borders · level & paywall gates
```

*(06 can start Phase 1 account settings after 02 Phase A; phases 2–5 need [03](./03-xp-and-ranking.md) progression/rank.)*

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
- Native build / Xcode / Mapbox ops (README or project docs).

---

## Adding milestone `07+` (template)

Create `milestones/07-your-slug.md` with this header:

```markdown
# Title

> **Milestone:** 07  
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
