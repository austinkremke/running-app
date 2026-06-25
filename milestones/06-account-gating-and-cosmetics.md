# Account settings, gating & progression cosmetics

> **Milestone:** 06  
> **Status:** Planned  
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
| Achievements | Mock list on Me tab (`AchievementsSection`) | Server catalog (`achievement_definitions`) + per-user unlocks; XP ledger `source: 'achievement'` |
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

### Phase 2 — Achievements

- `achievement_definitions` reference table + `user_achievements` (or ledger-only v1)
- Unlock rules (distance totals, streaks, first match win, etc.)
- Replace mock `profile.achievements`; “VIEW ALL” screen

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
| **Mock until wired** | Keep mock achievements until Phase 2 ships; don’t half-persist. |

---

## Open decisions

1. Which features are **premium** vs **level-gated** vs **free**? (Maintain a single spreadsheet before Phase 4/5.)
2. Achievement unlock: push notification on unlock?
3. Avatar borders: also show level badge, or rank-only frame?
4. Delete account: hard delete vs soft delete + retention policy.

---

## Dependencies

| Milestone | Relationship |
|-----------|--------------|
| [02 Supabase](./02-supabase-backend.md) | `profiles`, Storage, auth providers |
| [03 XP & rank](./03-xp-and-ranking.md) | `totalXp` / level for gates; `rank_tiers` for borders; XP ledger achievement source |
| [05 Matchmaking](./05-matchmaking-and-feed.md) | Match-based achievements; premium match modes (if any) |
