# XP & Leveling + Competitive Rank

> **Milestone:** 03  
> **Status:** Planned  
> **Depends on:** [01 Activity recording](./01-activity-recording.md), [02 Supabase](./02-supabase-backend.md) (Phase A–C shipped; `player_progress` + activities on server)  
> **Unblocks:** [05 Matchmaking & feed](./05-matchmaking-and-feed.md)

---

## Design principles

| Principle | Meaning |
|-----------|---------|
| **Lifetime XP is truth** | One number: `totalXp`. Level is **derived**, never stored as source of truth. |
| **Rank ≠ Level** | Level = personal grind. Rank = competitive standing (matches, percentile, Elo). |
| **Runs earn XP** | Primary input is completed activities (`ActivityRecord[]`), same path as Garmin/Strava later. |
| **Level 99 is asymptotic** | The curve is designed so no realistic human reaches 99; everyone always has a “next level” that feels reachable but never finishes the ladder. |
| **Transparent breakdown** | User sees *why* they earned XP (miles, pace, elevation, bonuses). |

The Me tab already shows **LEVEL** and **RANK** side by side — keep that mental model and enforce it in data:

```
┌─────────────────────┐     ┌─────────────────────┐
│  PROGRESSION (PvE)  │     │  COMPETITION (PvP)  │
│  totalXp → level    │     │  rating → rank tier │
│  never decreases    │     │  can go up/down     │
│  from runs, streaks │     │  from matches only  │
└─────────────────────┘     └─────────────────────┘
```

---

## 1. Data model

### Player progression (new)

```typescript
type PlayerProgress = {
  userId: string;
  totalXp: number;              // lifetime — never reset
  updatedAt: string;
};

type XpLedgerEntry = {
  id: string;
  awardedAt: string;
  totalXp: number;              // amount granted
  source: 'run' | 'match' | 'achievement' | 'onboarding' | 'bonus';
  sourceId?: string;            // activityId, matchId, etc.
  breakdown: XpBreakdownLine[]; // auditable
};

type XpBreakdownLine = {
  key: 'distance' | 'pace' | 'elevation' | 'duration' | 'streak' | 'first-run-today' | 'match-win';
  label: string;
  xp: number;
};
```

### Competitive rank (separate module)

**Postgres (reference + state)** — see [02 Supabase](./02-supabase-backend.md#db-first-catalogs-reference-data).

```sql
-- Catalog (seed.sql) — display names change here only
rank_tiers: id, display_name, subtitle, icon, min_rating, sort_order

-- Per user — numbers only, no rank title strings
player_rank: user_id, competitive_rating, season_wins, season_losses
```

```typescript
// App types (from generated database.ts + join/select)
type PlayerRank = {
  userId: string;
  competitiveRating: number;
  seasonWins: number;
  seasonLosses: number;
  updatedAt: string;
  // tier resolved at read time from rank_tiers — not stored as a label string
};

type RankTier = {
  id: string;                   // stable: 'bronze' — rename display, not id, when possible
  displayName: string;          // mutable: 'Bronze Runner' → 'Wood Division'
  subtitle: string;
  icon: string;
  minRating: number;
};
```

**Resolve tier for UI:** fetch `rank_tiers` (cached), then `tier = max tier where min_rating <= competitive_rating`.  
**Never** persist `displayName` on `player_rank` or `profiles`.

TypeScript-only view (for services):

```typescript
type PlayerRankRow = { /* from DB */ };
type RankTierRow = { /* from rank_tiers */ };
```

**Rule:** `PlayerProgress` and `PlayerRank` live in different services/contexts. Match screens read rank; Me tab / XP drawer read progression. Never derive rank from level or vice versa.

---

## 2. Level curve — “impossible 99, always another level ahead”

Use **lifetime total XP → level** with a steep curve.

### Option A (recommended): Explicit per-level thresholds, 99 is unreachable

Define `xpToAdvance(fromLevel → toLevel)` with exponential growth. Level is the highest `L` where `totalXp >= cumulativeXpForLevel(L)`.

Example shape (tune constants in config):

```
xpForLevelUp(L) = round(120 * 1.09^L)   // XP needed to go L → L+1

Level 1→2:   ~130 XP     (~0.3 mi run)
Level 10→11: ~280 XP
Level 25→26: ~980 XP
Level 50→51: ~7,500 XP
Level 75→76: ~55,000 XP
Level 90→91: ~280,000 XP
Level 98→99: ~1.1M XP   (many years of dedicated running)
```

**Lifetime XP to reach level 98:** on the order of **tens of millions** — achievable only for extreme long-term players. **Level 99** should require more XP than is realistic in a human lifetime (tune `xpForLevelUp(98)` accordingly).

Display cap: show levels **1–98** normally; at 98 optionally show “MAX” or “98+” with bar still filling toward the mythical 99.

### Option B: Soft cap via formula

```typescript
level = min(98, floor(k * log(totalXp + offset)))
```

Never hits 99 mathematically. Simpler but less transparent than per-level tables.

**Recommendation:** Option A — designers can tune config and simulate “runs per level” in a spreadsheet.

### Within-level UI

Derive from totals (powers existing `XpGainDrawer` animation):

```typescript
const level = levelFromTotalXp(totalXp);
const xpAtLevelStart = cumulativeXpForLevel(level);
const xpAtNextLevel = cumulativeXpForLevel(level + 1);
const currentXpInLevel = totalXp - xpAtLevelStart;
const xpToNextLevel = xpAtNextLevel - xpAtLevelStart;
const progress = currentXpInLevel / xpToNextLevel;
```

`useXpGainAnimation` already expects `startingLevel`, `startingXp`, `xpToNextLevel`, `xpEarned` — feed it **in-level** values from this derivation.

---

## 3. XP from a run (formula)

Input: `StoredActivity` (records + session summary).

### Base components

| Component | Formula idea | Notes |
|-----------|--------------|-------|
| **Distance** | `floor(miles * BASE_XP_PER_MILE)` | Core driver; e.g. 80–120 XP/mi |
| **Pace effort** | bonus if faster than personal rolling avg | Rewards effort, not sandbagging |
| **Elevation** | `floor(gainFeet / 100) * ELEVATION_XP` | Small bonus |
| **Duration** | cap or small bonus for moving time | Avoid idle farming |
| **Streak** | `1.0 + 0.05 * min(streakDays, 7)` | Multiplier on subtotal |
| **First run today** | flat +50 XP | Habit builder |

### Example

```typescript
distanceXp  = miles * 100
paceXp      = paceBonus(miles, avgPaceSec, userRollingAvgPaceSec)  // 0–15% of distanceXp
elevationXp = floor(elevationGainFt / 50) * 2
subtotal    = distanceXp + paceXp + elevationXp
multiplier  = streakMultiplier(consecutiveDays)
total       = round(subtotal * multiplier) + firstRunTodayBonus
```

### Anti-exploit

- Minimum distance (e.g. 0.1 mi) to earn XP
- Diminishing returns below 0.25 mi
- Cap XP per run (e.g. 5,000) until server validation
- Reject GPS-invalid activities (reuse activity validation later)

### Match XP (optional, still not rank)

Match **win** can grant a flat XP bonus (`+200 XP`) without touching `competitiveRating` logic. Rank only moves from match outcome formulas (Elo).

---

## 4. Architecture

```
Inputs
  ├── Completed Activity (ActivityRecord[])
  ├── Match Result
  └── Achievement

Progression Layer (separate)
  ├── xpCalculator
  ├── levelCurve
  ├── PlayerProgress
  └── XpLedger
       └── UI: XpGainDrawer, Me ExperienceCard

Competition Layer (separate)
  ├── rankCalculator (Elo)
  └── PlayerRank
       └── UI: Profile RANK, match screens, leaderboards
```

### Suggested files (when implementing)

```
src/
  types/
    progression.ts      # PlayerProgress, XpLedgerEntry, XpBreakdownLine
    rank.ts             # PlayerRank, RankTier
  config/
    levelCurve.ts       # xp thresholds, max level, tuning constants
    xpRewards.ts        # XP_PER_MILE, bonuses, caps
  services/
    progression/
      levelCurve.ts     # levelFromTotalXp, xpForNextLevel
      xpCalculator.ts   # computeXpFromActivity(activity, userStats)
      progressionService.ts  # awardXp, getProgress, applyLedger
    rank/
      rankCalculator.ts # Elo update from match (later)
      rankService.ts    # getRank, tierFromRating
  context/
    PlayerProgressContext.tsx
    PlayerRankContext.tsx   # or single UserContext with two slices
  storage/
    progressionStorage.ts   # local cache; sync to Supabase player_progress
```

Supabase tables: `player_progress`, `player_rank`, `xp_ledger` — see [02](./02-supabase-backend.md).

**Already in repo (Phase C stub):** `src/services/levelCurve.ts` derives level for feed/team display only — not wired to XP awards yet.

---

## 5. User flows

### After run

```
Stop run → PostRunScreen → "Add to activity feed"
  → xpCalculator.compute(activity)
  → progressionService.awardXp(...)
  → XpGainDrawer(real event + breakdown)
  → persist PlayerProgress (local + sync to Supabase)
```

Replace `MOCK_XP_GAIN_NORMAL` in `RunScreen.handleAddToFeed`.

### Me tab

- `ExperienceCard` reads `PlayerProgressContext` (real `totalXp`, derived level).
- `ProfileTopSection`: **LEVEL** from progression; **RANK** from `PlayerRank` (tier title, percentile) — not from level.

### Onboarding

- Generous starter XP → `awardXp({ source: 'onboarding' })` so first real run feels good but doesn’t skip the curve.

### Feed / social

- `RunUser.level` on feed cards = progression level (cosmetic flex).
- Matchmaking power / solo rank number = competitive rating only ([05](./05-matchmaking-and-feed.md)).

---

## 6. Keeping rank separate (concrete rules)

| Question | Level / XP | Rank |
|----------|------------|------|
| Goes down? | Never | Yes (losses) |
| From runs? | Yes | No (maybe tiny XP bonus only) |
| From matches? | Optional XP bonus | Yes (primary) |
| Shown on match screen | Optional badge | Primary (e.g. 24812, Top 12%) |
| Matchmaking | Ignored | Used |
| Season reset | No | Optional soft reset / decay |
| Leaderboards | Optional “highest level” fun tab | Primary competitive boards |

Over time: `ProfileRank` → competitive tier; `profile.level` → always from `levelFromTotalXp`, not mock constants.

---

## 7. Rollout phases

### Phase 1 — Core progression (local)

- `levelCurve` + `xpCalculator` + `PlayerProgressContext`
- Award XP on “Add to feed” from real `StoredActivity`
- Persist `totalXp` + last N ledger entries in AsyncStorage
- Wire `XpGainDrawer` + `ExperienceCard` + profile level display

### Phase 2 — Breakdown & polish

- XP breakdown lines in drawer (“+340 distance, +42 pace, ×1.1 streak”)
- Streak + first-run-today tracking
- Personal rolling avg pace for pace bonus

### Phase 3 — Rank system (still separate)

- `PlayerRank` + Elo from match results ([05](./05-matchmaking-and-feed.md))
- Replace mock `ProfileRank` / solo `info.rank` with real tier + rating
- Top Teams / leaderboards use competitive rating, not level

### Phase 4 — Server-authoritative

- XP awarded via Edge Function after activity sync ([02](./02-supabase-backend.md))
- Replay activity, anti-cheat, leaderboards, cross-device sync

### Phase 5 — Achievements & progression hooks (feeds [06](./06-account-gating-and-cosmetics.md))

- `achievement_definitions` catalog + unlock evaluation
- Achievement XP grants via ledger (`source: 'achievement'`)
- Export level + rank tier readers for level gates and avatar rank borders

---

## 8. Tuning checklist (before ship)

Simulate in a spreadsheet:

- XP for 0.05 mi walk vs 5 mi run vs marathon
- Runs needed for levels 2, 10, 25, 50
- Time to level 50 at 20 mi/week
- Confirm level 99 is unreachable in < 20 years at max realistic XP/day
- Confirm early levels feel fast (hook), mid levels steady, high levels aspirational

---

## 9. Open decisions

1. **Level 99 display:** hidden mythical bar, or visible “1.1M XP to 99” forever?
2. **Match XP:** yes/no bonus XP on win (leaning yes — small amount; rank still separate).
3. **Team/clan XP:** separate “clan points” (mock stats already have this) vs personal XP?
4. **Decay:** no XP decay (recommended); optional rank decay/inactivity only on competitive side.

---

## 10. Dependencies

| Milestone | Relationship |
|-----------|--------------|
| [01 Activity recording](./01-activity-recording.md) | XP computed from `StoredActivity` / `ActivityRecord[]` |
| [02 Supabase](./02-supabase-backend.md) | Phase A: `profiles` + trigger + `player_rank` seed defaults; Phase 4 server XP (`player_progress`, `xp_ledger`) |
| [05 Matchmaking](./05-matchmaking-and-feed.md) | Elo / rank UI and match-linked XP bonuses |
| [06 Account & gating](./06-account-gating-and-cosmetics.md) | Achievements, rank avatar borders, level gates |

---

## Summary

- Store **lifetime `totalXp`**; derive **level** from a steep exponential curve where **99 is practically unreachable**.
- Compute run XP from **distance (primary), pace, elevation, streaks** via `xpCalculator` on activity data.
- Keep **`PlayerRank` / Elo** in a separate service — never tied to level.
- **`rank_tiers` in Postgres** (seeded reference data); users store **`competitive_rating` only** — tier display from DB, not duplicated TS lists.
- Reuse existing XP UI; replace mocks with `PlayerProgressContext` when ready.
