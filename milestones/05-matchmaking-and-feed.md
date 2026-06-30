# Matchmaking, Feed & Social Sync

> **Milestone:** 05  
> **Status:** **In progress** — Phase 1 feed likes & comments **shipped**; Phase 2 Elo next  
> **Depends on:** [02 Supabase](./02-supabase-backend.md) (Phase A–D shipped; Phase C `feed_posts` required for Phase 1)  
> **Unblocks:** —

---

## Goal

Replace remaining mock match/social data with server-backed state: real opponents, persisted results, competitive rank updates — while keeping **level (XP)** and **rank (Elo)** separate per [03](./03-xp-and-ranking.md).

**Partially done in milestone 02:** `feed_posts`, team join/list, community + team feed tabs, active match screens (Phase D), static route maps on feed cards. This milestone covers **feed engagement (likes/comments)**, Elo, friends graph, matchmaking queue, and polish.

---

## Scope

| Area | Today | Target |
|------|-------|--------|
| Solo / team matches | Mock lineup tab | **Active** match screens from Postgres; lineup still mock |
| Match results | Static | Runs linked to `activity_id`; Elo update |
| Feed | **Server** posts + **static route maps**; **persisted likes & comments** | Friends graph, richer cards |
| Teams | **Server** (join, members, top list) — stats/activity mock | Full team stats, activity stream |
| Team chat | Mock | Realtime or polled messages ([02](./02-supabase-backend.md)) |
| Leaderboards | Top teams from DB; rank still mock in UI | `competitive_rating` + seasonal snapshots |

---

## Rollout phases

### Phase 1 — Feed likes & comments **shipped**

**Shipped:** `feed_reactions`, `feed_comments`, RLS via `can_view_feed_post`, `feedEngagementService.ts`, optimistic like toggle + `FeedCommentsDrawer` on `RunCard`.

**Out of scope for Phase 1**

- Friends tab, reply threads, notifications, emoji reactions beyond like

**Depends on:** [02 Phase C](./02-supabase-backend.md) `feed_posts` (shipped).

---

### Phase 2 — Elo & rank UI **(next)**

- `rankCalculator` on server; Me tab **RANK** from `player_rank` ([03](./03-xp-and-ranking.md))

### Phase 3 — Friends feed & richer cards

- Friends graph + friends tab (currently placeholder copy)
- Richer post cards (photos, pace highlights)

*Note: “Feed from real activities” shipped in [02 Phase C](./02-supabase-backend.md) — create post + community/team tabs + route maps.*

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

1. ~~Feed likes: toggle per user or count-only?~~ **Decided (Phase 1):** per-user like row; toggle on tap.
2. Comments: edit/delete own only in v1?
3. Team matches before solo Elo, or parallel?
4. Seasonal rank reset?
5. Minimum activity validation before match points count?

---

## Summary

**Ship next:** Elo + rank UI (Phase 2), then friends feed, matchmaking.
