# Wearable Integration (HealthKit — Apple Watch & Garmin)

> **Milestone:** 09
> **Status:** Planned
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

### Trust boundary — be honest about this

HealthKit data passes **through the client**, and Apple does not cryptographically sign HealthKit exports. A modified app could lie about what HealthKit returned. This model raises the bar substantially but is **not** tamper-proof.

Closing that gap requires **App Attest** (proves a request came from a genuine unmodified app instance on real hardware). Deferred to Phase 6 — warranted when stakes justify it (real prizes, meaningful leaderboards), not day one.

---

## Rollout phases

### Phase 1 — HealthKit foundation
- Native module + Expo config plugin (`@kingstinct/react-native-healthkit` preferred for TS types + plugin support; verify maintenance before committing).
- `com.apple.developer.healthkit` entitlement; `NSHealthShareUsageDescription` in [`app.config.js`](../app.config.js).
- Permission request UX + Settings toggle to connect/disconnect.
- Read-only to start — **no** write-back to HealthKit in v1.
- Requires a dev client build (already in place).

### Phase 2 — Ingestion pipeline
- Map `HKWorkout` → `ActivitySession` + summary; `HKWorkoutRoute` → coordinates/altitude; `heartRate` samples → `heartRateBpm`; `distanceWalkingRunning` samples → cumulative `distanceMeters`.
- **Two build strategies**, since sources differ:
  - *Route present* (Apple Watch): build records from route points, interpolate HR onto them.
  - *Route absent* (Garmin): build records on a time grid from distance + HR samples, no coordinates.
- Dedup by `HKWorkout.UUID` → `activities.external_id` (column exists).
- Reuse the existing sync path in [`activitySync.ts`](../src/services/activitySync.ts) — no second activity model.

### Phase 3 — Verification & server enforcement
- Persist provenance + tier alongside the activity.
- Gate `award_run_xp` and `credit_match_activity` on tier — unverified earns nothing and cannot score.
- Note: `credit_match_activity` already window-checks; extend it, don't replace it.

### Phase 4 — Background sync
- HealthKit observer queries + background delivery so watch runs land without opening the app.
- Dedupe on every pass; never double-award (XP awards are already idempotent per activity).

### Phase 5 — UI
- **Route-less empty state** for feed cards and run detail — the one genuinely new UI surface. Feed cards currently assume `activities.polyline`; run detail assumes a hero map.
- Source badge on imported runs (Apple Watch / Garmin).
- "Unverified — no XP" badge + explanation.
- Premium analytics cards already degrade correctly (they ship `unavailable`/`null` states) — **no work needed there.**

### Phase 6 — App Attest (deferred)
- Only when competitive stakes justify the added complexity.

---

## Schema & type changes

| Change | Where | Note |
|--------|-------|------|
| `latitude` / `longitude` → nullable | [`src/types/activity.ts`](../src/types/activity.ts) | **Blocking.** `ActivityRecord` currently requires both; route-less Garmin imports cannot be represented. Audit all consumers. |
| Add `'healthkit'` to `ActivitySource` | `src/types/activity.ts` | Keep `HKSource` app name in provenance metadata, not the enum. |
| Extend `ActivityExternalSource` | `src/types/activity.ts` | Currently `'garmin' \| 'strava'`. |
| `activities.verification_status` | migration | `'verified' \| 'unverified'`. |
| `activities.import_metadata` (jsonb) | migration | Source app, device, `wasUserEntered`, sample counts — the audit trail for the tier decision. |

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
