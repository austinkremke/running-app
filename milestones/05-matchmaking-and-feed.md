# Matchmaking, Feed & Social Sync

> **Milestone:** 05  
> **Status:** Planned  
> **Depends on:** [02 Supabase](./02-supabase-backend.md) (Phase A auth + Phase B activities), [03 XP & rank](./03-xp-and-ranking.md), [04 Integrations](./04-third-party-integrations.md) (optional for v1)  
> **Unblocks:** —

---

## Goal

Replace mock match, feed, and team data with server-backed state: real opponents, persisted results, activity feed, and competitive rank updates — while keeping **level (XP)** and **rank (Elo)** separate per [03](./03-xp-and-ranking.md).

---

## Scope

| Area | Today | Target |
|------|-------|--------|
| Solo / team matches | Mock screens | Postgres `matches` + participants |
| Match results | Static | Runs linked to `activity_id`; Elo update |
| Feed | `MOCK_RUNS` | `feed_posts` + synced activities |
| Team chat | Mock | Realtime or polled messages ([02](./02-supabase-backend.md)) |
| Leaderboards | Mock top teams | `competitive_rating` + seasonal snapshots |

---

## Rollout phases

### Phase 1 — Match persistence

- Create/join match; store state; link completed run on stop/sync

### Phase 2 — Elo & rank UI

- `rankCalculator` on server; Me tab **RANK** from `player_rank` ([03](./03-xp-and-ranking.md))

### Phase 3 — Feed from real activities

- “Add to feed” creates `feed_posts`; team/friends tabs query RLS

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
