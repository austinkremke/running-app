# Wearable Integration (HealthKit — Apple Watch & Garmin)

> **Milestone:** 09
> **Status:** In progress — Phases 1-3 shipped. Phase 1 (foundation) and Phase 2 (ingestion mapping) validated on real device data — Garmin route-less path + HR confirmed live end-to-end, including finding and fixing a real library gotcha (`filter: { workout }` silently returns zero HR samples; fixed via date-range filtering). Phase 3 (verification tier + server enforcement) fully shipped: migration, pure tier logic, server-side XP/match-credit gating, cross-app duplicate detection (`healthKitDedup.ts`), and a real "Sync Apple Watch & Garmin runs" Settings row wired to auto-publish. **Decided: auto-publish, not review-first** — simplest, consistent with how native runs already work; the pipeline is structured with an explicit seam (documented in `healthKitSyncService.ts`, right before the upsert) so a future review-before-publish flow is additive, not a rewrite. Phase 4 (background sync) and Phases 5-6 not started.
> **Depends on:** [01 Activity recording](./01-activity-recording.md), [02 Supabase](./02-supabase-backend.md) (activities + Storage), [03 XP & ranking](./03-xp-and-ranking.md) (`award_run_xp`)
> **Unblocks:** Heart Rate Analysis (currently dead code), wearable-first runs, Garmin without partner approval

---

## Goal

Ingest **Apple Watch and Garmin** activities into the existing `ActivityRecord[]` pipeline via **HealthKit** — one integration, both sources, **no Garmin Developer Program approval required**.

Imported activities earn XP and score in matches, gated behind a **server-enforced verification tier** that rejects hand-entered and fabricated workouts.

---

## Why HealthKit (decision record)

Garmin Connect writes activities into Apple Health, and Apple Watch writes there natively — so a single HealthKit reader covers both, plus any other Health-writing source (Strava, Wahoo, Peloton).

| Path | Covers | Approval gate | Verdict |
|------|--------|---------------|---------|
| **HealthKit** | Apple Watch + Garmin + others | App Store only | ✅ **Chosen** |
| Garmin Connect API | Garmin only (still need HealthKit/watch app for Apple Watch) | Garmin partner review (slow) | Deferred — apply in parallel |
| FIT file import | Garmin only, manual per-activity | None | Rejected — manual step every run |

### Verified limitation: Garmin does not sync GPS routes

Confirmed firsthand (Jul 2026) — Garmin Connect writes workouts and heart rate to HealthKit but **not** `HKWorkoutRoute`. This is a long-standing Garmin gap, not a config problem.

| | Apple Watch | Garmin (via Health) |
|---|---|---|
| Distance / duration / pace | ✅ | ✅ |
| Heart rate (time series) | ✅ | ✅ |
| GPS route | ✅ | ❌ |
| Pace Distribution card | ✅ | ❌ (needs per-point track) |
| Climbing Analysis card | ✅ | ❌ (needs per-point elevation) |
| **Heart Rate Analysis card** | ✅ | ✅ |

**Consequence:** route is a *quality* signal that unlocks the premium track-based analytics — **not** an eligibility gate for XP/matches. Gating on route would make the entire Garmin integration decorative.

**Sleeper win:** `ActivityRecord.heartRateBpm` is currently never populated by anything, so the Heart Rate Analysis card ships permanently "unavailable." This milestone is what turns it on.

---

## Verification model (anti-fake)

Grade every import; **enforce server-side**, never trust the client's own verdict.

### Signals available from HealthKit

**Policy (decided):** start **permissive** — gate on the few signals that directly indicate faking, record everything else as metadata. If abuse appears, tighten using observed patterns rather than guesswork.

| Signal | Use |
|--------|-----|
| `HKMetadataKeyWasUserEntered` | **Hard reject if true.** Catches hand-typed workouts — the most common fake, and the cheapest to detect. |
| HR series present | **Hard reject if absent.** Best available proxy for "actually came off a wearable." |
| Pace plausibility | **Hard reject.** Reuse `MAX_PLAUSIBLE_SPEED_MPS` (9.5) from [`paceSegments.ts`](../src/services/paceSegments.ts). |
| HR plausibility | **Hard reject.** Reuse 30–230bpm bounds from [`heartRateSamples.ts`](../src/services/heartRateSamples.ts). |
| `endDate` recency | **Hard reject** if future-dated or older than the recency window (~7 days to start; stops backfilling history to farm XP). |
| `HKSource` / `HKSourceRevision` | **Record, don't gate.** Any source allowed for now. This is the first lever to tighten if a fabricator app shows up. |
| `HKDevice` (manufacturer/model/hardware/software) | **Record, don't gate.** Requiring it would reject legitimate writers (e.g. Strava) that omit device metadata. |
| HR sample density + coverage | **Record, don't gate.** A real 30-min run has hundreds of samples spread across the duration; 3 samples is suspicious but not proof. |
| Pace↔HR coherence | **Record, don't gate.** 6:00/mi at 95bpm is not a human run, but false-positive risk is real. |

**Why record the non-gating signals anyway:** they're the audit trail. If faking becomes a problem, you can query `import_metadata` across historical activities to see exactly which sources/patterns the cheaters used, then promote the right signal from "recorded" to "gating" — and retroactively identify affected accounts.

### Tiers

| Tier | Requirements | XP | Matches | Feed |
|------|--------------|-----|---------|------|
| **Verified** | `wasUserEntered=false` + HR series present + plausible pace/HR + within recency window | ✅ full | ✅ scores | ✅ |
| **Unverified** | any gating check fails | ❌ none | ❌ cannot score | ✅ shown, badged |

Both Apple Watch and Garmin clear **Verified** without a route, and without a curated source allowlist.

### Cross-app duplicate detection

A separate problem from fake activities: the *same real run* can legitimately land in Apple Health more than once if the runner uses multiple fitness apps that each sync to Health (e.g. Garmin Connect **and** Strava both writing their own `HKWorkout` for one physical run, or Garmin plus the phone's own GPS tracking simultaneously). Each is a distinct `HKWorkout` with its own UUID, so UUID-based dedup doesn't catch it.

`healthKitDedup.ts`'s `isDuplicateOfExisting` compares a candidate against the runner's existing activities (any source, not just HealthKit) on **close start time (±5 min) and close distance (±15%)**. A match is skipped entirely rather than merged — acceptable for v1; which of the cross-posted duplicates "wins" is whichever the sync pass reaches first, not deterministic by source.

### Trust boundary — be honest about this

HealthKit data passes **through the client**, and Apple does not cryptographically sign HealthKit exports. A modified app could lie about what HealthKit returned. This model raises the bar substantially but is **not** tamper-proof.

Closing that gap requires **App Attest** (proves a request came from a genuine unmodified app instance on real hardware). Deferred to Phase 6 — warranted when stakes justify it (real prizes, meaningful leaderboards), not day one.

---

## Rollout phases

### Phase 1 — HealthKit foundation ✅ shipped
- `@kingstinct/react-native-healthkit` + `react-native-nitro-modules`, config plugin in [`app.config.js`](../app.config.js) (`NSHealthShareUsageDescription`/`NSHealthUpdateUsageDescription`, read-only — no write-back).
- `healthKitService.ts` — availability check, `requestHealthKitReadAccess` (requires `HKWorkoutTypeIdentifier` **and** `HKWorkoutRouteTypeIdentifier` separately, or `getWorkoutRoutes()` throws "Authorization not determined").
- Validated with a real permission dialog + real workout data on-device.

### Phase 2 — Ingestion pipeline ✅ shipped
- `healthKitMappers.ts` maps `HKWorkout` → `ActivityRecord[]`; `HKWorkoutRoute` → coordinates/altitude; `heartRate` samples → `heartRateBpm`; `distanceWalkingRunning`/`totalDistance` → cumulative `distanceMeters`.
- **Two build strategies**, since sources differ:
  - *Route present* (Apple Watch): `buildRecordsFromRoute` — records from route points, nearest-in-time HR attached.
  - *Route absent* (Garmin — confirmed never syncs `HKWorkoutRoute`): `buildRecordsFromTimeGrid` — 15s time grid, distance apportioned linearly, no coordinates.
- `healthKitService.ts`'s `buildActivityRecordsForWorkout` picks the strategy automatically per workout.
- **Real bug found and fixed on-device**: `queryQuantitySamples`'s `filter: { workout }` silently returns zero HR samples even when real samples exist inside that workout's window (confirmed via an unfiltered date-range control query). Fixed by filtering on `filter: { date: { startDate: workout.startDate, endDate: workout.endDate } }` instead.

### Phase 3 — Verification & server enforcement ✅ shipped
- `20260719000001_activity_verification_tier.sql` — `activities.verification_status`/`import_metadata`.
- `healthKitVerification.ts` — pure `computeVerificationTier`, permissive gating per the table above.
- `20260719000002_gate_xp_and_match_credit_on_verification.sql` — `award_run_xp`/`credit_match_activity` return zero/skipped for `verification_status = 'unverified'`; both extended in place, not replaced, and NULL (native runs) is completely unaffected.
- `healthKitDedup.ts` — cross-app duplicate detection (see above).
- `healthKitSyncService.ts.syncHealthKitWorkouts(userId)` — fetch → map → verify → dedup → **auto-publish** (upserts with `id = HKWorkout.uuid`, idempotent re-sync; uploads track; calls the same XP/match-credit RPCs a native run uses; **and** calls `createFeedPost` to create the matching `feed_posts` row — the feed reads from `feed_posts`, not `activities` directly, and native runs only get one via an explicit "Add to feed" tap. First pass missed this; synced workouts weren't appearing in the feed until it was added).
- **Decided: auto-publish, not review-first.** The pipeline stops right before the upsert with a docblock marking that as the seam for a future review-before-publish flow — switching later means intercepting at that one point, not re-deriving fetch/map/verify/dedup.
- Real "Sync Apple Watch & Garmin runs" row added to Settings (manual trigger; background delivery is Phase 4).

### Phase 4 — Background sync
- HealthKit observer queries + background delivery so watch runs land without opening the app.
- Dedupe on every pass; never double-award (XP awards are already idempotent per activity).

### Phase 5 — UI (partially shipped)
- **Route-less empty state** ✅ shipped for the two spots that assumed a route always exists: `RunCardMedia.tsx` (feed card) renders the photo full-width or nothing (not a blank map) when there's no route, and `RunDetailScreen.tsx`'s hero map Pressable simply doesn't render when `routePoints.length < 2`.
- Source badge on imported runs (Apple Watch / Garmin) — not started.
- "Unverified — no XP" badge + explanation — not started.
- Premium analytics cards already degrade correctly (they ship `unavailable`/`null` states) — **no work needed there.**

### Phase 6 — App Attest (deferred)
- Only when competitive stakes justify the added complexity.

---

## Schema & type changes

| Change | Where | Status |
|--------|-------|--------|
| `latitude` / `longitude` → nullable | [`src/types/activity.ts`](../src/types/activity.ts) | ✅ Done — all consumers audited; `activityPolyline.ts`/`activityAdapters.ts` made null-safe. |
| Add `'healthkit'` to `ActivitySource` | `src/types/activity.ts` | ✅ Done. |
| Extend `ActivityExternalSource` | `src/types/activity.ts` | ✅ Done — added `'apple-watch'` alongside `'garmin' \| 'strava'`. |
| `activities.verification_status` | `20260719000001_activity_verification_tier.sql` | ✅ Done. |
| `activities.import_metadata` (jsonb) | `20260719000001_activity_verification_tier.sql` | ✅ Done. |

Follow the [SCHEMA.md workflow](../supabase/SCHEMA.md): migration → rollback → `db push` → regenerate `database.ts` → docs sync.

---

## Dependencies

- [01](./01-activity-recording.md) — `ActivityRecord`, adapters
- [02](./02-supabase-backend.md) — `activities`, Storage, RLS
- [03](./03-xp-and-ranking.md) — `award_run_xp` must learn about tiers
- [04](./04-third-party-integrations.md) — supersedes its Garmin approach; Strava import there is still independently valid

---

## Open decisions

1. ~~Allowlist policy~~ — **decided: permissive.** Any `HKSource` allowed; record it and tighten only if abuse appears.
2. Recency window — start generous (**7 days** suggested, to survive travel and delayed syncs) rather than 48h, consistent with the permissive stance. Revisit if backfill farming appears.
3. Should route-less runs be *excluded* from route-dependent leaderboards, or just render map-less?
4. Write phone-tracked runs back **into** HealthKit (nice-to-have; needs `NSHealthUpdateUsageDescription`).
5. Android wearable story — HealthKit is iOS-only; Android needs the Garmin API (approval) or Health Connect. Out of scope here.
