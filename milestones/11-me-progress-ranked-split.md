# Me tab — Progress vs Ranked split

> **Milestone:** 11  
> **Status:** **Phase 1 shipped** — segmented `MeTabs` (Progress / Competitive) added to `MeScreen`; header chrome unchanged  
> **Depends on:** [03](./03-xp-and-ranking.md) (Level ≠ Rank), [05](./05-matchmaking-and-feed.md) Elo / competitive stats, [06](./06-account-gating-and-cosmetics.md) achievements  
> **Unblocks:** clearer Me UX, room for season/rank deep-dives and progression polish without one endless scroll

---

## Goal

Split the **Me** tab so **progression (XP / level / PvE)** and **competitive rank (Elo / matches / PvP)** are visually and navigationally separate — matching the data model we already enforce ([03](./03-xp-and-ranking.md)).

Today both live on one scroll, with LEVEL and RANK side-by-side in the header. That teaches the right mental model, but as each side grows (achievements, overall stats ranges, competitive record, future season / Pro analytics), one page becomes crowded and easy to misread as “one score.”

---

## Today (single scroll)

`MeScreen` layout:

| Region | Contents | System |
|--------|----------|--------|
| Sticky header | `ProfileTopSection` — avatar, name, team, **LEVEL \| RANK**, next-rank goal | Both |
| Sticky header | `ExperienceCard` — XP bar toward next level | Progress |
| Scroll card | Achievements carousel + View All | Progress |
| Scroll card | `OverallStatsSection` + range tabs (All / Week / Month / Year) | Progress (activity) |
| Scroll card | `CompetitiveStatsSection` — W–L, win rate, avg distance / match | Ranked |

**Key files:** `src/screens/MeScreen.tsx`, `src/components/me/*`, `usePlayerProgress`, `useRankDisplay`, `profileStatsService`, `competitiveStatsService`.

`UserProfileScreen` (other users) reuses `ProfileTopSection` + overall stats — decide later whether the split applies there too (likely Progress-only for others, or the same two segments with public data only).

---

## Target

Shared identity chrome stays put; the **body** switches between two modes.

```
┌─────────────────────────────────────┐
│  Avatar · Name · Team               │  shared
│  [ Progress ]  [ Ranked ]           │  segment / tabs
├─────────────────────────────────────┤
│  mode-specific header metrics       │
│  mode-specific scroll content       │
└─────────────────────────────────────┘
```

Exact control (segmented control under the avatar, pills, or nested tabs) is an open UX decision — prefer something that fits existing Me styling, not a second bottom-tab.

### Progress mode

**Job:** “How am I growing as a runner in this app?”

| Include | Notes |
|---------|--------|
| Level (large) | From `player_progress` / `levelFromTotalXp` |
| `ExperienceCard` | XP in level / to next |
| Achievements | Carousel + View All (unchanged) |
| Overall activity stats | Distance, runs, time, etc. + range tabs + `StatDetailDrawer` |
| Streak / consistency (if surfaced later) | Still progression, not Elo |
| Optional later | Lifetime XP summary, level history — still not rank |

**Do not show here:** competitive rating, tier title as the hero number, W–L record, match win rate.

### Ranked mode

**Job:** “How am I doing in competition?”

| Include | Notes |
|---------|--------|
| Rank tier + Power Rating | From `player_rank` + `rank_tiers` (existing `useRankDisplay`) |
| Next-rank goal | Move here from the cramped Progress-adjacent header |
| `CompetitiveStatsSection` | W–L, win rate, avg distance / match (always all-time today) |
| Optional later | Elo / rating sparkline, recent match list, season record, solo vs team breakdown, percentile |
| Optional Pro later | Season-pass progress, advanced competitive analytics ([10](./10-paid-features.md)) |

**Do not show here:** XP bar, level as the hero number, achievement grind (except competitive-category badges if we ever filter the carousel).

### Shared (always visible)

- Avatar (rank border stays — it’s competitive *cosmetic*, earned from rating; fine on both modes)
- Display name, team name
- Settings entry (header / shell — unchanged)

---

## Design rules

| Rule | Detail |
|------|--------|
| **Two systems, two surfaces** | Progress mode never derives display from `competitive_rating`; Ranked mode never derives display from `total_xp` / level |
| **Copy** | Use “Level” / “XP” vs “Rank” / “Power Rating” / “Record” — never “score” for both |
| **Gates** | Level gates copy belongs near Progress; ranked queue locks already live on Match tab |
| **Minimal churn** | Prefer composing existing sections into two panels over rewriting services |
| **Other profiles** | Default proposal: same split if we show their rank; otherwise Progress-only body |

---

## Suggested rollout

| Phase | Work |
|-------|------|
| **1 — IA only** ✅ | `MeTabs` segmented control (`src/components/me/MeTabs.tsx`) in `MeScreen`'s scroll card. **Progress** tab: achievements, `PersonalRecordsSection`, `OverallStatsSection` + range tabs. **Competitive** tab: new `RankSummaryCard` (`src/components/me/RankSummaryCard.tsx` — tier + Power Rating + next-rank goal, same data `ProfileTopSection` already showed) + `CompetitiveStatsSection` (moved out of the always-visible scroll). Header (`ProfileTopSection` LEVEL\|RANK, `ExperienceCard`) is unchanged/shared — not split per-mode yet (open decision #2 below still open). |
| **2 — Ranked depth** | Expand Ranked: recent matches, rating trend, clearer next-tier progress (no new backend required if data already exists) |
| **3 — Progress polish** | Optional streak / consistency block; achievement progress bars ([06](./06-account-gating-and-cosmetics.md) backlog) |

No schema change required for Phase 1.

---

## Open decisions

1. Default tab on open — **Progress** (habit/identity) vs last-used vs Ranked if user has active match history?
2. Does `ProfileTopSection` split into two variants, or one component with a `mode: 'progress' | 'ranked'` prop?
3. Apply the same split on `UserProfileScreen`?
4. Competitive achievements — Progress carousel only, or also a Ranked filter?
5. Team competitive summary on Ranked mode, or keep team stats exclusively on the Team tab?

---

## Dependencies

| Milestone | Relationship |
|-----------|--------------|
| [03 XP & rank](./03-xp-and-ranking.md) | Source of Level ≠ Rank rule; Me tab already shows both |
| [05 Matchmaking](./05-matchmaking-and-feed.md) | Elo UI + competitive record data |
| [06 Account & gating](./06-account-gating-and-cosmetics.md) | Achievements live on Progress |
| [07 Team play](./07-team-play.md) | Team name in chrome; team record stays on Team tab unless we decide otherwise |
| [10 Paid features](./10-paid-features.md) | Future Ranked-mode Pro analytics / season pass affordances |
