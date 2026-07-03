# Team Play — Creation, Management & Team Matchmaking

> **Milestone:** 07  
> **Status:** In progress — Phase 1–3 shipped (creation/management, team rating, matchmaking queue); Phase 4 scoring/finalize next  
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

### Phase 1 — Team creation & management **shipped**

**Shipped (migration `20250703000001_team_management.sql`):**

- `create_team` RPC — `assert_feature_gate('create_team')`, tag/name/motto validation, team + leader membership in one transaction; **gate activated** (`is_active = true`, L10)
- Management RPCs (security definer, role-checked): `update_team` (leader/co; tag immutable), `promote_member` / `demote_member` / `transfer_leadership` (leader), `kick_member` (leader any non-leader; co-leader members only), `disband_team` (leader; blocked during active team match)
- **Leave rules (revised from plan):** leader departure **auto-promotes a successor** (longest-tenured co-leader, else member) via row trigger — covers `delete_own_account` cascade so a leader deleting their account never blocks or bricks the team; explicit `transfer_leadership` remains the in-app path. Last member out auto-disbands (trigger).
- UI: **Create a Team** button on the join prompt (locked “Reach level 10” below gate via `useFeatureGate('create_team')`); `TeamFormDrawer` (create + edit modes: name, tag, motto, logo icon/accent with live preview); roster row **⋮ menu** (promote/demote/transfer/remove with confirmations); `TeamManageSection` (Edit Team, Disband, Leave)

**Known v1 limits:** member ⋮ menu uses `Alert` (iOS-first; Android caps at 3 buttons).

**Post-ship additions:** join prompt is now a **real team browser** (`list_top_teams` → join any non-full team; hardcoded Road Warriors join removed); Me tab shows the user's **real team name** (hidden when teamless); team XP bar removed (level badge only — combined-XP level is a snapshot, not a progression; clan points bar is backlog); Match tab shows a **“No active team match” empty state** instead of the mock Road Warriors vs Pacers fallback.

**Key files:** `teamService.ts` (create/update/promote/demote/kick/transfer/disband), `TeamFormDrawer.tsx`, `TeamManageSection.tsx`, `TeamScreen.tsx`.

### Phase 2 — Team rating & top teams **shipped**

**Shipped (migration `20250703000002_team_rank_and_stats.sql`):**

- `team_rank` (`team_id` PK, `competitive_rating` default 1000, season W/L); provisioned by trigger on `teams` insert + backfill; read-all RLS, system-only writes
- `apply_team_elo_match_result_system` — team mirror of the solo Elo RPC (wired to finalize in Phase 4)
- `get_team_overview` RPC (security definer — teammates' activities are RLS-protected): rating, season record, rank position + team count, 7-day + lifetime team distance, per-member 7-day distance
- `list_top_teams` RPC: one round-trip, ordered by real rating, includes member count + combined member XP
- **Team tab de-mocked:** team level/XP = combined member lifetime XP on the shared curve; rank card = real position (`#N`, `Top X% of N teams`, `—` offline); stats = members / 7-day miles / season record; member rows show real 7-day distance + `Joined <date>` instead of fake presence
- **Top Teams de-mocked:** ordered by rating; points column = `competitive_rating`; level = combined member XP

### Phase 3 — Team matchmaking queue **shipped**

**Shipped (migration `20250703000003_team_matchmaking.sql`):**

- `team_match_queue` (`team_id`, `match_type_id`, `competitive_rating`, `status`, `enqueued_by`); RLS: own-team members can read the queue row (drives searching state)
- RPCs mirroring solo: `enqueue_team_matchmaking` / `cancel_team_matchmaking` / `get_team_matchmaking_status` — leader/co-leader role check inside; min roster (`team_min_roster_to_queue` = 2); team rating from `team_rank`
- `try_pair_team_queue` mirrors `try_pair_solo_queue`: rating band ±400, same match type, different teams; creates `matches` row (`kind = 'team'`, both `*_team_id`) and `enroll_team_roster` enrolls **all current members of both teams** as `match_participants` with `team_id` + side (roster snapshot at pairing)
- **Team tab de-mocked** (`TeamMatchTab`): real team summary (name, level, `competitive_rating`) from `useMyTeam`; real match format from `match_types`; **Find Match** via `useTeamMatchmaking` (`teamMatchmakingService`) with searching state + poll; leader/co-leader gating with "only leaders" notice; roster-too-small + no-team empty states. `MOCK_MATCHMAKING` and the lineup picker (`LineupSection` / `AvailableRunnersSection`) removed — top-N scoring needs no pre-match lineup.

**Depends on Phase 4 to complete the loop:** paired team matches have no finalize yet, so they stay `active` until [Phase 4](#phase-4--scoring-finalize--completion) scoring + `finalize_team_match` ship. Away-roster overlay on the active screen is still Phase 5.

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
