# Team Play — Creation, Management & Team Matchmaking

> **Milestone:** 07  
> **Status:** Next  
> **Depends on:** [02 Supabase](./02-supabase-backend.md) (Phase C teams + Phase D match shell), [03 XP & rank](./03-xp-and-ranking.md) (rank separation rules), [05 Matchmaking & feed](./05-matchmaking-and-feed.md) (solo queue/Elo/completion patterns to mirror), [06](./06-account-gating-and-cosmetics.md) Phase 4 (`feature_gates` — `create_team` reserved at L10)  
> **Unblocks:** team challenges, seasonal team leaderboards

---

## Goal

Replace the seeded demo team match and mock lineup with a real team lifecycle: **create → manage → queue → compete → team Elo**. Mirror the solo matchmaking architecture (05 Phase 4–6) wherever it fits; diverge only where teams are genuinely different (roles, roster scoring, shared rating).

**Already real today:** `teams` / `team_members` (roles: `leader` / `co-leader` / `member`, unique `tag`, `member_max 30`, one team per user), join/leave, `matches.home_team_id` / `away_team_id`, `team_3day` match type, team match chat (`match_messages`), Realtime refresh, match tab indicators.

**Still mock/demo:** team creation (does not exist), team management UI, lineup tab, team scoreboard (seeded `state_json` + live-member overlay), team rank card, top-teams ordering.

---

## Decided design (v1)

| Decision | Choice | Why |
|----------|--------|-----|
| **Match scoring** | **Top-N contributors** — everyone on the roster can run; only the top N point-earners per side count toward the team score (N from `match_types` config, default 5) | Fair across roster sizes; no lineup management friction; internal competition for a scoring spot |
| **Team rating** | **Separate team Elo** — `team_rank` mirrors `player_rank` (`competitive_rating`, season W/L); moves only from team match results | Survives roster churn; individual Elo untouched by team play; reuses the proven Elo RPC pattern |
| **Queue rights** | **Leader + co-leaders** enqueue/cancel (and accept future team challenges) | Matches existing role model; delegation via promotion; members see “ask your leader” state |
| **Creation access** | **Activate `create_team` gate at level 10** (`feature_gates` UPDATE — no code change); **joining stays free at any level** | Leading a team is an invested-user feature; social hook stays open for new users |
| **Roster snapshot** | Participants enrolled **at pairing time**; mid-match joiners don’t score, leavers keep their points on the board | Prevents mid-match ringers; matches solo’s fixed-participant model |

**Rank separation rules still apply ([03](./03-xp-and-ranking.md)):** runs during team matches earn normal personal XP and count toward team points; **personal `competitive_rating` never moves from team matches**; matchmaking pairs on `team_rank.competitive_rating` only.

---

## Rollout phases

### Phase 1 — Team creation & management

- `create_team` RPC — `assert_feature_gate('create_team', …)`, unique-tag validation, creates team + leader membership in one transaction; **activate the gate seed row** (`is_active = true`)
- Management RPCs (security definer, role-checked): `update_team` (leader/co), `promote_member` / `demote_member` (leader), `kick_member` (leader/co; cannot kick leader), `transfer_leadership` (leader), `disband_team` (leader; blocked mid-match)
- Leave rules: leader must transfer or disband first; last member leaving disbands
- UI: **Create Team** flow from Team tab (name, tag, motto, logo icon/accent — existing team card fields); roster row long-press → manage drawer (promote/kick); team settings screen (edit fields, transfer, disband); locked create CTA below level 10 (`useFeatureGate('create_team')`)

### Phase 2 — Team rating & top teams

- `team_rank` table (`team_id` PK, `competitive_rating` default 1000, `season_wins`, `season_losses`); created by `create_team`; backfill migration for existing teams
- `apply_team_elo_match_result_system` — mirror of the solo system Elo RPC, updates `team_rank`
- `listTopTeams` orders by real `competitive_rating`; Team tab rank card + Top Teams screen drop synthetic numbers

### Phase 3 — Team matchmaking queue

- `team_match_queue` (`team_id`, `match_type_id`, `competitive_rating`, `status`, `enqueued_by`)
- RPCs mirroring solo: `enqueue_team_matchmaking` / `cancel_team_matchmaking` / `get_team_matchmaking_status` — role check (leader/co-leader) inside; min roster size to queue (v1 constant: 2)
- Pairing mirror of `try_pair_solo_queue`: rating band ±400, same match type; creates `matches` row (`kind = 'team'`, both `*_team_id`) and enrolls **current members of both teams** as `match_participants` with side + `team_id` (roster snapshot)
- Team tab: **Find Match** wired for leaders/co-leaders; searching card; members see who queued the team

### Phase 4 — Scoring, finalize & completion

- `credit_match_activity` already keys on `match_participants` — verify team path end-to-end (runs during team match credit personal points)
- `team_match_score(match_id, side)` SQL helper: sum of **top N** participant points per side (N from `match_types.scoring_top_n`, seeded 5 for `team_3day`)
- Scoreboard ranks contributors per side and marks who currently counts toward the top-N total
- `finalize_team_match` on `ends_at` → winner via `team_match_score` → team Elo + season W/L; persist completion payloads for **all members** (mirror `persist_solo_match_completions`); completion drawer via generalized `SoloMatchCompletionProvider` pattern
- Team forfeit (leader/co-leader, mirror `forfeit_solo_match`) — optional in v1, else backlog

### Phase 5 — Team match UX (retire the demo)

- Active team match screen fully server-backed: both rosters real (drop seeded `state_json` overlay + `MOCK_ACTIVE_TEAM_MATCH` fallback), live contributor scoreboard, countdown; chat + Realtime already work
- Migration: complete/cancel the seeded Road Warriors vs Pacers demo match (teams remain as real teams)
- Team season record card from `team_rank`
- Tab indicators: `useMatchTabIndicators` already covers active team matches — extend for team queue “searching” state

### Backlog (not v1)

- [ ] Team challenges (directed team-vs-team invites — mirror `solo_match_challenges`)
- [ ] Seasonal resets + team leaderboard snapshots
- [ ] Leader-picked lineup as an alternative match type (uses existing lineup UI concepts)
- [ ] Team stats / team activity stream (Team tab placeholders)
- [ ] Dynamic pace scoring shared with [05 backlog](./05-matchmaking-and-feed.md#future-follow-ups-milestone-05-backlog)

---

## Open decisions

1. **Top-N value:** 5 for `team_3day` (tunable per match type via `match_types.scoring_top_n`) — confirm after first real matches.
2. **Min roster to queue:** 2 vs 3 (v1: 2; revisit when teams fill out).
3. **Disband/kick mid-match:** blocked outright (v1 recommendation) vs treated as forfeit.
4. **Team forfeit in v1** or backlog.
5. **`member_max`:** stays 30, or tighten once top-N makes large rosters less decisive.

---

## Manual QA (needs two teams, multiple accounts)

1. Level-10 user creates a team; sub-level-10 user sees locked create CTA but can join via existing flow.
2. Leader promotes a co-leader; co-leader queues the team; member sees searching state but no cancel rights.
3. Two queued teams within ±400 rating pair into an active match; both rosters render from server.
4. Members run ≥0.1 mi → personal points on scoreboard; team total = top-N sum; a 6th contributor doesn’t raise the total (N=5).
5. After `ends_at`, finalize → `team_rank` Elo + W/L update; every member gets the completion drawer.
6. New member joining mid-match does not appear in participants; demo match no longer surfaces.
