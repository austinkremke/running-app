# Activity Recording (Local)

> **Milestone:** 01  
> **Status:** Done  
> **Depends on:** —  
> **Unblocks:** [02 Supabase](./02-supabase-backend.md), [03 XP & rank](./03-xp-and-ranking.md), [04 Integrations](./04-third-party-integrations.md)

---

## Goal

Record runs on-device, persist locally, and show post-run summary (map, stats, charts) without a backend.

---

## What shipped

- **`ActivityRecord`** — time-series samples with cumulative `distanceMeters` (Garmin/Strava-shaped).
- **`StoredActivity`** — session + records + derived `PostRunSummary` in AsyncStorage.
- **Run flow** — start/stop, live map route, drawer stats, post-run modal.
- **Charts** — grid-aligned pace/elevation from records (shared distance grid with x-axis).
- **Import/export stubs** — `activityExchange.ts` for future FIT / Strava / GPX.

Key paths: `src/types/activity.ts`, `src/services/activity*.ts`, `src/context/RunContext.tsx`, `src/storage/activityStorage.ts`.

---

## Known gaps (not this milestone)

- Cloud sync → [02 Phase B](./02-supabase-backend.md#phase-b--activity-sync) (**done**).
- Feed posts → [02 Phase C](./02-supabase-backend.md#phase-c--social--teams-read-heavy) (**done**).
- No server-side validation / anti-cheat.
- XP drawer still mocked on “Add to feed” (no `xp_ledger` writes).
- Garmin/Strava import not implemented.

---

## Handoff to milestone 02

Backend accepts the same **`ActivityRecord[]` + session summary** shape. Phases A–C shipped: summaries in Postgres, full tracks in Storage, `feed_posts` on “Add to feed”.
