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

- No cloud sync or multi-device.
- No server-side validation / anti-cheat.
- XP drawer still mocked on “Add to feed”.
- Garmin/Strava import not implemented.

---

## Handoff to milestone 02

Backend should accept the same **`ActivityRecord[]` + session summary** shape — do not invent a second activity model. Store summaries in Postgres; optional full tracks in Storage.
