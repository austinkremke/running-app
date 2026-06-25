# Matchmaking, Feed & Social Sync

> **Milestone:** 05  
> **Status:** Planned  
> **Depends on:** [02 Supabase](./02-supabase-backend.md) (Phase A–C shipped), [03 XP & rank](./03-xp-and-ranking.md), [04 Integrations](./04-third-party-integrations.md) (optional for v1)  
> **Unblocks:** —

---

## Goal

Replace remaining mock match/social data with server-backed state: real opponents, persisted results, competitive rank updates — while keeping **level (XP)** and **rank (Elo)** separate per [03](./03-xp-and-ranking.md).

**Partially done in milestone 02 Phase C:** `feed_posts`, team join/list, community + team feed tabs. This milestone covers matches, Elo, friends graph, reactions, and polish.

---

## Scope

| Area | Today | Target |
|------|-------|--------|
| Solo / team matches | Mock screens | Postgres `matches` + participants |
| Match results | Static | Runs linked to `activity_id`; Elo update |
| Feed | **Server** (`feed_posts` + `activities`) — no likes/comments/friends | Reactions, friends tab, richer cards |
| Teams | **Server** (join, members, top list) — stats/activity mock | Full team stats, activity stream |
| Team chat | Mock | Realtime or polled messages ([02](./02-supabase-backend.md)) |
| Leaderboards | Top teams from DB; rank still mock in UI | `competitive_rating` + seasonal snapshots |

---

## Rollout phases

### Phase 1 — Match persistence

- Create/join match; store state; link completed run on stop/sync

### Phase 2 — Elo & rank UI

- `rankCalculator` on server; Me tab **RANK** from `player_rank` ([03](./03-xp-and-ranking.md))

### Phase 3 — Feed from real activities

- ~~“Add to feed” creates `feed_posts`; team/friends tabs query RLS~~ **Partial (02 Phase C):** create post + community/team tabs; friends + reactions remain

### Phase 4 — Matchmaking

- Queue / pairing worker (not in Supabase alone); power from rank, not level

### Phase 5 — Real-time polish

- Live scoreboard, team chat via Realtime

---

## Rules (from milestone 03)

- **Matchmaking uses `competitive_rating`**, not player level.
- **XP** may bonus on match win; **rank** moves only from match outcome.
- **Activities** must exist on server ([02](./02-supabase-backend.md)) before counting toward match points.

---

## Open decisions

1. Team matches before solo Elo, or parallel?
2. Seasonal rank reset?
3. Minimum activity validation before match points count?
