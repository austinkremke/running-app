# Third-Party Integrations (Garmin & Strava)

> **Milestone:** 04  
> **Status:** Planned  
> **Depends on:** [01 Activity recording](./01-activity-recording.md), [02 Supabase](./02-supabase-backend.md)  
> **Unblocks:** [05 Matchmaking & feed](./05-matchmaking-and-feed.md)

---

## Goal

Import (and eventually export) activities from Garmin and Strava into the same **`ActivityRecord[]`** pipeline as phone-recorded runs — no second activity model.

---

## Approach

| Source | Ingest | Notes |
|--------|--------|-------|
| **Garmin** | Parse FIT → `ActivityRecord[]` | Prefer device `distance` on import; store raw FIT in [Storage](./02-supabase-backend.md#activity-storage-strategy-critical) |
| **Strava** | Streams API → zip by index → records | OAuth tokens server-side only |
| **Export** | GPX/TCX first; FIT for Garmin Connect later | `activityExchange.ts` stubs |

Server: Supabase **Edge Functions** for OAuth callbacks, webhooks, and import jobs ([02](./02-supabase-backend.md)).

---

## Rollout phases

### Phase 1 — Strava import (read)

- OAuth connect in app → tokens in Postgres (encrypted)
- Edge Function: fetch activity + streams → `StoredActivity` → save via sync API

### Phase 2 — Garmin FIT upload

- User picks FIT file or Garmin Connect export
- Parse client- or server-side → same record shape

### Phase 3 — Export & share

- Export activity as GPX; “Share to Strava” upload

### Phase 4 — Background sync

- Periodic pull + webhooks; dedupe by `external_id`

---

## Dependencies

- [01](./01-activity-recording.md) — `ActivityRecord`, `activityAdapters`, `activityExchange`
- [02](./02-supabase-backend.md) — **Phase A:** auth, `profiles` trigger, RLS; then `activities`, Storage, Edge Functions

---

## Open decisions

1. Strava first vs Garmin first?
2. Import triggers XP ([03](./03-xp-and-ranking.md)) immediately or only “verified” phone runs at first?
