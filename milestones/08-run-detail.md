# Run Detail (Activity Overview)

> **Milestone:** 08
> **Status:** **Shipped** (v1) — open follow-ups below
> **Depends on:** [01 Activity recording](./01-activity-recording.md) (`ActivityRecord`, `PostRunSummary`, charts), [02 Supabase](./02-supabase-backend.md) (`activities` + `feed_posts`), [05 Matchmaking & feed](./05-matchmaking-and-feed.md) (feed cards, likes/comments)
> **Unblocks:** deep-linking to runs from matches / team feed / profile history

## Goal

A single **Run Detail** screen shown whenever anyone opens a run — from the feed, or "view details" anywhere in the app — for **their own run or someone else's**. It centers the mapped route (tap → fullscreen pan/zoom), then charts, mile splits, match attribution, and engagement, with delete for your own runs.

This is mostly **assembly of existing pieces**. The rich data is already fetched: the feed query pulls `activities:activity_id (*)` ([feedService.ts](../src/services/feedService.ts)), so `summary_json` (chart data), `polyline`, `match_id`, and timings are already on hand — the `Run` type just drops them today.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| **Delete a match-counted run** | Allowed **any time**; `feed_posts` + `match_activity_credits` cascade on delete. |
| **Fullscreen map** | **Modal overlay** with opacity+scale animation (no nav route, no shared-element lib). |
| **Mile splits for old runs** | **Null-safe** — splits persist into `summary_json.splits` for new runs; older runs simply omit the section. No derive-from-chart fallback. |
| **Heart rate on others' runs** | **Show** it when present (already in the feed pipeline). |

## Screen anatomy (single ScrollView, top → bottom)

1. **Header** — back; overflow `⋮` → **Delete** (own runs only).
2. **Hero map** — route fit-to-bounds w/ ~8% padding (`regionFromRoutePoints(points, 1.08)`). Tap → fullscreen.
3. **Title + meta** — title, date/time (`started_at`), location.
4. **Match badge** — when `activity.match_id` is set: "Counted toward a match" chip (static v1; deep-link later).
5. **Primary stats** — distance, time, avg pace, calories, avg HR, elevation (reuse `PostRunPrimaryStats`).
6. **Charts** — Pace / Elevation / Heart Rate tabs (reuse `PostRunChartSection`; empty series auto-hide).
7. **Mile splits** — new `MileSplitsSection`; per-mile pace bars, fastest/slowest emphasis. Hidden when absent.
8. **Engagement** — likes + comments for any run (reuse `RunCardEngagement` + `FeedCommentsDrawer`).

## Reuse vs. new

**Reuse:** `PostRunPrimaryStats`, `PostRunChartSection` / `PostRunLineChart`, `RunCardEngagement`, `FeedCommentsDrawer`, `RunCardHeader` pieces, `StaticRouteMapPreview` / `MapboxMapView`, `regionFromRoutePoints`.

**New:**
- `computeMileSplits(records)` service + `summary_json.splits` persistence in [buildPostRunSummary](../src/services/buildPostRunSummary.ts); `PostRunSummary.splits?`.
- `MileSplitsSection` component (null-safe).
- `interactive` prop on `MapViewProps` / `MapboxMapView` — decouple gestures from `showRouteEndpoints` (today `isRoutePreview = showRouteEndpoints` locks scroll/zoom).
- `FullscreenRouteMap` modal overlay.
- `fetchActivityDetail(activityId)` → `ActivityDetail` view-model (stats + summary + routePoints + splits + match ref + author + engagement).
- `RunDetailScreen`; `runDetail` route + `activeRunId` in `AppShell`; `RunCard onPress`.
- `delete_activity(p_activity_id)` RPC.

## Backend

One migration: `delete_activity(p_activity_id)` security-definer RPC — deletes an activity the caller owns; `feed_posts.activity_id` and `match_activity_credits.activity_id` are already `on delete cascade`. Splits are additive JSON in `summary_json` (no schema change).

## Permissions

- **Delete** — `activity.user_id === viewer` only.
- **Likes / comments** — anyone who can see the post (existing `can_view_feed_post`).
- Others' runs otherwise read-only.

## Rollout — **all shipped**

1. ✅ `delete_activity` migration (`20250704000001`) → pushed → types regenerated.
2. ✅ Mile splits: `computeMileSplits` ([activityStreams.ts](../src/services/activityStreams.ts)) + `summary_json.splits` in `buildPostRunSummary`; `MileSplitsSection`; 4 unit tests.
3. ✅ `interactive` prop on `MapViewProps` / `MapboxMapView` (decouples gestures from `showRouteEndpoints`); `FullscreenRouteMap` modal.
4. ✅ `fetchRunExtras` + `RunDetailScreen` (reuses `PostRunPrimaryStats`, `PostRunChartSection`, `MileSplitsSection`, `RunCardEngagement`, `FeedCommentsDrawer`).
5. ✅ `runDetail` route + `AppShell` wiring; `RunCard` body tappable (engagement row untouched); feed reloads after delete.
6. ✅ Tests (65 pass) + docs sync.

**Key files:** `screens/RunDetailScreen.tsx`, `services/activityDetailService.ts`, `services/activityStreams.ts` (`computeMileSplits`), `components/post-run/MileSplitsSection.tsx`, `components/map/FullscreenRouteMap.tsx`.

**Note:** detail keys off the **feed post id** (`Run.id`); `fetchRunExtras(postId)` augments the already-loaded `Run` with summary/splits/match/owner/date. Non-feed entry points (match activity lists, future run history) will need an activity-id variant.

## Open follow-ups (not v1)

- [ ] Deep-link the match badge to the match screen.
- [ ] Run history list on Me / profile that opens this screen.
- [ ] Photos carousel on detail (feed already stores one `photo_url`).
- [ ] Backfill splits for existing runs (deferred — null-safe for now).
