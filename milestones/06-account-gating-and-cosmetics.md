# Account settings, gating & progression cosmetics

> **Milestone:** 06  
> **Status:** **In progress** — Phase 2 achievements shipped; Phase 1 account settings next  
> **Depends on:** [02 Supabase](./02-supabase-backend.md) (auth + profiles), [03 XP & rank](./03-xp-and-ranking.md) (level, rank tiers, achievements data model)  
> **Unblocks:** —

---

## Goal

Ship account management, real achievements, progression cosmetics, and **two independent gate types**:

1. **Paywall** — subscription / premium entitlement (RevenueCat or equivalent).
2. **Level gates** — free progression unlocks (derived from `totalXp` / level).

Rank-based **avatar decorative borders** are cosmetic only — not paywalled unless we explicitly bundle them later.

---

## Scope

| Area | Today | Target |
|------|-------|--------|
| Account settings | Sign out only (auth screen) | Settings screen: profile edit, units, notifications prefs, linked providers, delete account |
| Achievements | **Server catalog + unlocks** (`achievementService`, Me tab, Community block) | View All + progress bars polish |
| Avatar rank borders | Plain avatars on feed / Me / team | Decorative frame from **competitive rank tier** (not level) |
| Paywall blocking | None | Entitlements block premium features (e.g. advanced stats, extra match slots — TBD catalog) |
| Level blocking | None | Feature flags keyed by `levelFromTotalXp` (e.g. team create, match types — TBD catalog) |

---

## Rollout phases

### Phase 1 — Account settings

- Settings entry from Me tab
- Edit display name / avatar upload (Storage + `profiles`)
- Sign out, delete account flow (Supabase auth + profile cleanup policy)
- App version / legal links

### Phase 2 — Achievements **shipped**

**Shipped:** `achievement_definitions`, `user_achievements`, `achievement_events`, `evaluate_achievements` + `record_achievement_event` RPCs, v1 seed catalog (~35 defs, 29 active), Me tab unlocks + View All modal, Community section, hooks into run/feed/social/team/match flows.

#### Principles

| Rule | Detail |
|------|--------|
| **First unlock** | Complete **first synced run** (≥0.1 mi). No onboarding/welcome/profile badges. |
| **One action → one badge** | Posting a run is one achievement, not three for the same session. |
| **Lean v1 catalog** | ~35 definitions; expand later via seed. |
| **Server-authoritative** | Client may record intent events; unlock + XP via RPC (mirror `award_run_xp`). |
| **Idempotent** | One row per `(user_id, achievement_id)`; re-evaluation never double-awards. |
| **Retroactive** | First eval backfills unlocks for existing miles/runs (fair to early users). |

#### Database schema (proposed)

**`achievement_definitions`** — reference catalog (seed)

| Column | Purpose |
|--------|---------|
| `id` | Stable slug, e.g. `first_run` |
| `display_name` | UI title |
| `description` | Short copy |
| `category` | `distance`, `consistency`, `performance`, `social`, `community`, `team`, `competitive`, `longterm` |
| `sort_order` | Order within category |
| `tier` | Visual variant: `bronze` / `silver` / `gold` / `elite` (hex badge color in UI) |
| `icon` | Ionicon or asset key |
| `xp_reward` | Bonus XP via `xp_ledger` (`source: 'achievement'`); typically 50–250 early, up to 2,500 long-term |
| `criteria_type` | Evaluator key (see table below) |
| `criteria_json` | Thresholds, e.g. `{"miles": 50}` or `{"event": "follow_instagram"}` |
| `is_hidden` | Secret achievements (none in v1) |
| `is_active` | Soft-disable; `false` until dependency ships (match wins, friends) |
| `requires_achievement_id` | Optional chain (unused in v1) |

**`user_achievements`** — per-user unlocks

| Column | Purpose |
|--------|---------|
| `user_id` | FK → `profiles` |
| `achievement_id` | FK → `achievement_definitions` |
| `unlocked_at` | timestamptz |
| `progress_snapshot_json` | Optional debug snapshot at unlock |
| PK | `(user_id, achievement_id)` |

**`achievement_events`** — one-time client-recorded intents (community/growth)

| Column | Purpose |
|--------|---------|
| `user_id` | FK → `profiles` |
| `event_type` | e.g. `follow_instagram`, `rate_app` |
| `occurred_at` | timestamptz |
| `metadata_json` | Optional |
| UNIQUE | `(user_id, event_type)` |

RLS: authenticated read-all on definitions; users read own unlocks/events only. Inserts on unlocks/events via **security definer RPC** only.

**Optional later:** `user_achievement_progress` for “48 / 50 mi” progress bars — defer until View All screen needs it.

#### Criteria types (evaluators)

Each `criteria_type` is implemented once on the server; new achievements = new seed rows.

| `criteria_type` | Data source |
|-----------------|-------------|
| `activity_count` | Count `activities` |
| `lifetime_distance_miles` | Sum `activities.distance_meters` |
| `single_run_distance_miles` | Max single activity |
| `single_run_pace_sec_per_mi` | Best pace on qualifying run (min distance) |
| `streak_days` | `player_progress.streak_days` |
| `level_reached` | Derived from `player_progress.total_xp` |
| `feed_post_count` | Count `feed_posts` |
| `feed_like_given_count` | Count `feed_reactions` by user |
| `feed_like_received_count` | Reactions on user's posts |
| `feed_comment_count` | Count `feed_comments` by user |
| `team_joined` | Row in `team_members` |
| `match_enrolled_count` | Count `match_participants` |
| `match_win_count` | `player_rank.season_wins` (or match results when wired) |
| `competitive_rating_min` | `player_rank.competitive_rating` |
| `friend_count` | Friends graph (blocked — [05 Phase 3](./05-matchmaking-and-feed.md)) |
| `client_event` | Row in `achievement_events` |

#### Evaluation triggers

| After… | Re-check achievements |
|--------|------------------------|
| Activity sync / `award_run_xp` | Distance, count, pace, streak, level |
| `publishActivityToFeed` | Feed post |
| Like / comment | Social |
| Team join | `join_team` |
| `apply_elo_match_result` | Wins, rank tier |
| `record_achievement_event` | Community/growth |
| Match completed (future) | Match completion wins |

**Core RPC:** `evaluate_achievements(p_user_id, p_trigger)` → newly unlocked list + XP ledger grants.

#### v1 achievement catalog (~35)

**Runs & distance (5)** — active

| id | display_name | criteria |
|----|--------------|----------|
| `first_run` | First Run | `activity_count` ≥ 1 |
| `first_feed_post` | On the Feed | `feed_post_count` ≥ 1 |
| `five_miles` | 5 Miles | `lifetime_distance_miles` ≥ 5 |
| `fifty_miles` | 50 Miles | `lifetime_distance_miles` ≥ 50 |
| `hundred_miles` | 100 Miles | `lifetime_distance_miles` ≥ 100 |

**Consistency (5)** — active

| id | display_name | criteria |
|----|--------------|----------|
| `week_streak` | 7-Day Streak | `streak_days` ≥ 7 |
| `month_streak` | 30-Day Streak | `streak_days` ≥ 30 |
| `ten_runs` | 10 Runs | `activity_count` ≥ 10 |
| `fifty_runs` | 50 Runs | `activity_count` ≥ 50 |
| `hundred_runs` | 100 Runs | `activity_count` ≥ 100 |

**Performance (6)** — active

| id | display_name | criteria |
|----|--------------|----------|
| `five_k` | 5K | `single_run_distance_miles` ≥ 3.1 |
| `ten_miler` | 10 Miler | `single_run_distance_miles` ≥ 10 |
| `half_marathon` | Half Marathon | `single_run_distance_miles` ≥ 13.1 |
| `marathon` | Marathon | `single_run_distance_miles` ≥ 26.2 |
| `sub_eight` | Sub 8 | `single_run_pace_sec_per_mi` ≤ 480, min 1 mi |
| `sub_seven` | Sub 7 | `single_run_pace_sec_per_mi` ≤ 420, min 1 mi |

**Social — in-app (4)** — active

| id | display_name | criteria |
|----|--------------|----------|
| `first_like` | High Five | `feed_like_given_count` ≥ 1 |
| `first_comment` | Say Something | `feed_comment_count` ≥ 1 |
| `ten_likes_received` | Crowd Favorite | `feed_like_received_count` ≥ 10 |
| `share_post` | Share the W | `client_event`: `share_feed_post` |

**Community & growth (5)** — mixed

| id | display_name | criteria | v1 active |
|----|--------------|----------|-----------|
| `rate_app` | Rate Run Off | `client_event`: `rate_app` | yes |
| `notifications_on` | Stay in the Loop | `client_event`: `notifications_on` | yes |
| `follow_instagram` | Follow on Instagram | `client_event`: `follow_instagram` | yes |
| `follow_tiktok` | Follow on TikTok | `client_event`: `follow_tiktok` | yes |
| `add_friend` | Add a Friend | `friend_count` ≥ 1 | yes — [05 Phase 3](./05-matchmaking-and-feed.md) shipped |

Community badges use **honor-system v1**: user completes in-app action (opens store review, grants notification permission, taps official social link). Server records intent via `record_achievement_event`; cannot verify IG/TikTok follow or App Store review without external APIs. Suggested XP: **50–100** each.

**Team & competitive (6)**

| id | display_name | criteria | v1 active |
|----|--------------|----------|-----------|
| `join_team` | Join the Crew | `team_joined` | yes |
| `first_match` | Throw Down | `match_enrolled_count` ≥ 1 | yes |
| `first_win` | First Blood | `match_win_count` ≥ 1 | **no** — until match completion → Elo ([05 Phase 4](./05-matchmaking-and-feed.md)) |
| `ten_wins` | Ten Wins | `match_win_count` ≥ 10 | **no** |
| `silver_rank` | Silver | `competitive_rating_min` ≥ 1200 | yes |
| `gold_rank` | Gold | `competitive_rating_min` ≥ 1400 | yes |

**Long-term (4)** — active

| id | display_name | criteria |
|----|--------------|----------|
| `five_hundred_miles` | 500 Miles | `lifetime_distance_miles` ≥ 500 |
| `thousand_miles` | 1,000 Miles | `lifetime_distance_miles` ≥ 1000 |
| `level_twenty_five` | Level 25 | `level_reached` ≥ 25 |
| `level_fifty` | Level 50 | `level_reached` ≥ 50 |

**Active at launch:** ~30 achievements. **Inactive in seed (`is_active: false`):** `first_win`, `ten_wins`.

#### Implementation sub-phases (Phase 2)

| Sub-phase | Work |
|-----------|------|
| **2a — Schema + seed** | Migration + `seed.sql` catalog; RLS; regen types |
| **2b — Evaluator** | `evaluate_achievements` RPC; hook into `award_run_xp`, feed, social, team, Elo |
| **2c — Client events** | Share sheet, review prompt, notification permission, IG/TikTok links → `record_achievement_event` |
| **2d — UI** | `achievementService.ts`; replace Me tab mock; View All screen; unlock toast |

#### UI placement

- **Me tab** — recent unlocks carousel (existing `AchievementsSection` pattern).
- **View All** — grouped by category; locked vs unlocked.
- **Settings / Community block** — Rate app, notifications, Follow IG/TikTok (not mixed with run milestones). Add friend greyed until friends ship.

#### XP reward guidelines

| Tier | XP range |
|------|----------|
| Community / growth | 50–100 |
| Early run/social | 100–250 |
| Consistency / performance | 250–500 |
| Competitive | 500–1,000 |
| Long-term | 1,000–2,500 |

Achievement XP is **one-time only** — supplementary to run XP, not a farming loop.

#### Trackability summary

| Ready today | Blocked on future work |
|-------------|------------------------|
| Runs, distance, pace, streak, level, feed, likes, comments, team, match enroll, rank rating, add friend | `first_win`, `ten_wins` → match completion (05 Phase 4) |

#### Phase 2 open decisions

1. Progress bars on locked achievements in v1?
2. Retroactive backfill on first login after ship? (Recommend **yes**.)
3. Confirm official Instagram/TikTok URLs for follow links.
4. Review flow: `StoreReview.requestReview()` only vs. deep link + confirm tap.

### Phase 3 — Avatar rank decorative borders

- Map `rank_tiers` → border asset / color token
- Feed `RunCardHeader`, Me `ProfileTopSection`, team roster avatars
- Fallback border for unranked / default tier

### Phase 4 — Level blocking features

- Central `featureGates` config: `{ featureId, minLevel }`
- UI: locked state + “Reach level N” CTA (not subscription copy)
- Server enforcement where abuse matters (Edge Function or RLS helper)

### Phase 5 — Paywall blocking features

- RevenueCat (or StoreKit) integration; `entitlements` on profile or separate table
- Central `premiumFeatures` config separate from level gates
- Paywall sheet component; restore purchases
- Server validation for premium-only APIs

---

## Design rules

| Rule | Detail |
|------|--------|
| **Level ≠ rank for cosmetics** | Avatar borders reflect **competitive rank tier** ([03](./03-xp-and-ranking.md)). Level gates unlock **features**, not rank frame. |
| **Two gate systems** | Never conflate “needs level 12” with “needs Pro” — show the correct unlock path. |
| **DB-first catalogs** | Achievement defs, feature gate tables, and rank tier art keys live in Postgres seeds ([02](./02-supabase-backend.md#db-first-catalogs-reference-data)). |
| **Mock until wired** | ~~Keep mock achievements until Phase 2 ships~~ Phase 2 shipped; mock profile stats still placeholder. |

---

## Open decisions

1. Which features are **premium** vs **level-gated** vs **free**? (Maintain a single spreadsheet before Phase 4/5.)
2. Achievement unlock: push notification on unlock? (See [06 Phase 2 catalog](./06-account-gating-and-cosmetics.md#phase-2--achievements).)
3. Avatar borders: also show level badge, or rank-only frame?
4. Delete account: hard delete vs soft delete + retention policy.

---

## Dependencies

| Milestone | Relationship |
|-----------|--------------|
| [02 Supabase](./02-supabase-backend.md) | `profiles`, Storage, auth providers |
| [03 XP & rank](./03-xp-and-ranking.md) | `totalXp` / level for gates; `rank_tiers` for borders; XP ledger achievement source |
| [05 Matchmaking](./05-matchmaking-and-feed.md) | Match-based achievements; premium match modes (if any) |
