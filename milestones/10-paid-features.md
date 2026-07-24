# Paid features & monetization

> **Milestone:** 10  
> **Status:** **Planned** — product catalog decided; implementation lands via [06 Phase 5](./06-account-gating-and-cosmetics.md#phase-5--paywall-blocking-features)  
> **Depends on:** [06](./06-account-gating-and-cosmetics.md) Phase 5 (RevenueCat / entitlements), [05](./05-matchmaking-and-feed.md) matches, [07](./07-team-play.md) team play, [08](./08-run-detail.md) analytics surface  
> **Unblocks:** Pro paywall UI, premium API enforcement, season pass cosmetics pipeline, tournament / seasonal-event entry gating

---

## Goal

Define **what is free**, **what is Pro**, and **what we will not sell**, so level gates (`feature_gates`) and subscription entitlements stay separate and the competitive ladder stays trustworthy.

**Core rule:** never paywall the habit loop — record → lock in → match → feed. Sell **edge, depth, convenience, and status**.

---

## Packaging

| SKU | Shape | Notes |
|-----|--------|--------|
| **Run Off Pro** | Monthly + annual (~2 months free on annual) | Single consumer SKU at launch |
| **Team Pro** | Deferred | Leader-paid team seat later, once team play is sticky |
| **Starter / level boost** | Optional one-time | Acquisition only — soft progression (XP toward level gates) or cosmetics; **never** competitive rating |

Do not ship Free / Plus / Pro / Team tiers before conversion data exists.

---

## Pro catalog (v1)

Five pillars. Everything else is nice-to-have or deferred.

### 1. Match insights / scouting

Competitive **information** edge — not score inflation.

- Predicted scores for the opposing player / team
- Richer mid-match visibility than the free scoreboard summary
- Suggested runs for you (and for your team) that close the gap
- **Competitive History (shipped)** — solo ranked rating-over-time graph on the Me tab's Competitive tab, one point per completed match; tapping a point shows that match's result/rating change with a tap-through to the match detail screen. Gated by the same real RevenueCat entitlement as All-Time Bests (`isPremium`), not `__DEV__`. See [supabase/SCHEMA.md § Solo rating history](../supabase/SCHEMA.md).

### 2. Season pass (win-milestone cosmetics)

Recurring seasonal track: **wins unlock cosmetics** at sparse milestones so art load stays small.

| Example track | Reward intent |
|---------------|---------------|
| 1 win | Entry cosmetic |
| 5 wins | Mid-tier |
| 10 wins | Exclusive / season highlight |

**Constraints:**

- Start with a **short track** (≈4–5 rewards), not a large cosmetic shop
- Prefer variants / recolors of a few base assets over many unique designs
- Rank avatar borders from competitive tier stay **free** ([06 Phase 3](./06-account-gating-and-cosmetics.md#phase-3--avatar-rank-decorative-borders-shipped)) — do not sell what free play already earns
- Wins mean real match wins (solo and/or team — decide per season); no pay-to-skip the track in v1

### 3. Advanced personal & team analytics

Depth beyond basic post-run / Me-tab stats.

**Personal (already in progress, currently ungated until paywall ships):**

- Pace Distribution
- Climbing Analysis
- Heart Rate Analysis
- **All-Time Personal Bests (shipped, real entitlement gate)** — chronological PR progression per distance milestone (1/2 mile, 1k, 1 mile, 5k, 5 mile, 10k, half marathon, marathon): every run that set a new all-time best at the time it happened, oldest to newest, ending at the current record. Reached via "View All" from the Me tab's Personal Records section. Gated by real RevenueCat entitlements (Milestone 06 Phase 5) via a full-screen `PaywallScreen`, not `__DEV__` — the other three cards below are still ungated pending the same wiring.
- Later: cross-run trends, matched-climb history, interval / lap analysis

**Team:**

- Contribution / top-N scoring insights
- Roster form, load, and who is carrying match scoring
- Season trends for the club (W/L, Elo trajectory, distance per match)

### 4. Private matches

Invite-only or friends/team custom matches outside the public ranked queue.

- Custom duration / window
- Friend group or team-vs-team without open matchmaking
- Does **not** replace public ranked play (that stays free)

### 5. Tournaments & seasonal events

Time-boxed competitive formats beyond the always-on ranked queues — Pro unlocks **entry / participation**, not better scoring math.

| Format | Intent |
|--------|--------|
| **Tournaments** | Bracket or multi-round events (solo and/or team); scheduled windows; standings + elimination or Swiss-style |
| **Seasonal events** | Limited-time challenges / ladders tied to a season theme (distance goals, win streaks, themed match rules) |

**Rules:**

- Everyday ranked solo / team matchmaking stays **free** (level-gated only) — tournaments and seasonal events are the special lane
- Entry is an entitlement of Run Off Pro (or included with annual); do **not** sell per-tournament pay-ins that buy placement
- Rewards lean cosmetic / season-pass progress / bragging rights — never competitive rating inflation or forced Elo gains
- Free users can **spectate / see standings** where it helps FOMO; competing requires Pro
- Can share art/rewards with the season pass track so we don’t invent a second cosmetics pipeline

**Relationship to season pass:** seasonal events and the win-milestone cosmetics track can run in the same “season” calendar; tournaments are optional peak moments inside that season.

---

## Free forever (do not paywall)

| Area | Why |
|------|-----|
| Run recording + XP lock-in | Habit loop |
| Ranked solo / team queue (subject to **level** gates only) | Acquisition + ladder integrity — tournaments / seasonal events are the Pro competitive lane |
| Feed view / post / likes; basic comments (level-gated) | Social loop |
| Basic match scoreboard + chat | Fair, transparent competition |
| Own history, achievements, basic stats | Trust |
| Rank decorative borders | Earned from competitive rating |
| Join team, add friend, settings, delete account | Account hygiene |

**Level gates ≠ Pro.** Under-leveled users see “Reach level N”; non-subscribers see Pro unlock copy. Never mix the two paths ([06 design rules](./06-account-gating-and-cosmetics.md#design-rules)).

---

## Explicitly rejected / deferred

| Idea | Verdict | Why |
|------|---------|-----|
| **Incognito consumable** (hide score for a day so opponents can’t plan) | **Rejected as paid** | Soft pay-to-win via information asymmetry; arms race with scouting; toxic in team matches; undermines transparent scoreboard brand |
| Fog-of-war as a **symmetric mode** (“blind match” both sides) | Optional later | Mode design, not monetization |
| Fog as a **scarce season reward** | Optional later | Earnable, not pay-to-obscure |
| Paywalled ranked queue | Never | Kills acquisition |
| Buy competitive rating / forced wins | Never | Destroys trust |
| Large cosmetic shop at launch | Deferred | Art cost; season pass milestones are enough |

---

## Nice-to-have (not v1 pillars)

Keep out of the launch pitch unless cheap to ship with Pro:

- GPX / FIT export
- Extra concurrent match slots / more friend challenges
- Background HealthKit sync (free = manual; Pro = auto — ties to [09](./09-wearable-integration.md) Phase 4)
- Profile banners, feed card skins, victory flair beyond season track
- Delayed score reveal as a Pro soft-edge (weaker than full invisibility)

Earlier earmarks in [06](./06-account-gating-and-cosmetics.md) (export, match slots, premium cosmetics) still apply as **secondary** Pro perks, not the five pillars above.

---

## Gate systems (reminder)

```
feature_gates (level)     → free progression unlocks
premium / entitlements    → Run Off Pro (this doc)
rank_tiers cosmetics      → free, from competitive rating
season pass cosmetics     → Pro seasonal track, from match wins
```

Implementation wiring (RevenueCat, `entitlements`, paywall sheet, server checks) lives in [06 Phase 5](./06-account-gating-and-cosmetics.md#phase-5--paywall-blocking-features). This milestone owns the **product catalog**; 06 owns the **plumbing**.

---

## Open decisions

1. Season pass: count solo wins, team wins, or both toward the same track?
2. Private matches: Elo-rated, unrated, or player choice?
3. Analytics: hard-gate the three run-detail cards at Pro launch, or leave a free teaser (e.g. summary only)?
4. Starter level-boost IAP: ship with Pro launch or later?
5. When to introduce Team Pro as a second SKU?
6. Tournaments: solo-only at first, team-only, or both?
7. Do tournament / event results affect regular Elo, a separate event rating, or neither (cosmetics / standings only)?
8. Free spectating of live tournament brackets — yes by default, or Pro-only viewing too?

---

## Dependencies

| Milestone | Relationship |
|-----------|--------------|
| [06 Account & gating](./06-account-gating-and-cosmetics.md) | Phase 5 implements entitlements + paywall UI against this catalog |
| [05 Matchmaking](./05-matchmaking-and-feed.md) | Scoreboard / scouting surface; private match modes; future tournament brackets build on match infra |
| [07 Team play](./07-team-play.md) | Team analytics + private team matches |
| [08 Run detail](./08-run-detail.md) | Advanced analytics cards |
| [09 Wearables](./09-wearable-integration.md) | Optional later: background sync as Pro convenience |
